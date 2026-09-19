import argparse
import asyncio
import logging
import signal
import sys
from atlas.worker.worker import AtlasWorker

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("atlas.worker.main")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Atlas Distributed Worker Process")
    parser.add_argument(
        "--name",
        type=str,
        default=None,
        help="Optional custom worker identifier",
    )
    return parser.parse_args()


async def main() -> None:
    args = parse_args()
    worker = AtlasWorker(worker_name=args.name)

    loop = asyncio.get_running_loop()

    def handle_signal():
        logger.info("Signal received, initiating graceful shutdown...")
        worker.stop()

    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, handle_signal)
        except NotImplementedError:
            # Signal handlers not implemented on Windows event loop for non-main thread
            pass

    try:
        await worker.run()
    except (KeyboardInterrupt, asyncio.CancelledError):
        logger.info("Worker stopped by keyboard interrupt.")
        worker.stop()
        await worker.deregister()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        sys.exit(0)

import socket
import string

base = "ctce6q40849"
chars = string.ascii_lowercase + string.digits
found = []

print(f"Testing appending/prepending characters to {base}...")
for c in chars:
    for candidate in [base + c, c + base]:
        host = f"atlas-postgres.{candidate}.ap-south-1.rds.amazonaws.com"
        try:
            ip = socket.gethostbyname(host)
            found.append((host, ip))
        except Exception:
            pass

print("Results:", found)

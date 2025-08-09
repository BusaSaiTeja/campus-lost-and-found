from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization
import base64

# Generate a private key
private_key = ec.generate_private_key(ec.SECP256R1())

# Serialize private key to PEM format
private_pem = private_key.private_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PrivateFormat.PKCS8,
    encryption_algorithm=serialization.NoEncryption()
)

# Get public key from private key
public_key = private_key.public_key()

# Serialize public key to uncompressed point format (raw bytes)
public_numbers = public_key.public_numbers()
x = public_numbers.x.to_bytes(32, 'big')
y = public_numbers.y.to_bytes(32, 'big')
uncompressed_pub_key = b'\x04' + x + y

# Encode keys in URL-safe base64 (no padding)
def urlsafe_b64encode_nopad(data):
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('utf-8')

private_key_b64 = urlsafe_b64encode_nopad(private_pem)
public_key_b64 = urlsafe_b64encode_nopad(uncompressed_pub_key)

print("Public Key:", public_key_b64)
print("Private Key PEM:", private_pem.decode())

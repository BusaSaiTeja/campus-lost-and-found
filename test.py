from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization
import base64

def urlsafe_b64encode_nopad(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('utf-8')

# Generate private key on curve SECP256R1 (P-256)
private_key = ec.generate_private_key(ec.SECP256R1())

# Serialize private key to PEM (optional, for reference)
private_pem = private_key.private_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PrivateFormat.PKCS8,
    encryption_algorithm=serialization.NoEncryption()
)

# Extract raw private scalar (32 bytes)
private_numbers = private_key.private_numbers()
private_scalar_bytes = private_numbers.private_value.to_bytes(32, 'big')

# Get public key in uncompressed point format (0x04 || X || Y)
public_key = private_key.public_key()
public_numbers = public_key.public_numbers()
x_bytes = public_numbers.x.to_bytes(32, 'big')
y_bytes = public_numbers.y.to_bytes(32, 'big')
uncompressed_pub_key = b'\x04' + x_bytes + y_bytes

# Encode keys with URL-safe base64 without padding
private_key_b64 = urlsafe_b64encode_nopad(private_scalar_bytes)
public_key_b64 = urlsafe_b64encode_nopad(uncompressed_pub_key)

print("VAPID Public Key (base64url, no padding):")
print(public_key_b64)
print("\nVAPID Private Key (raw scalar, base64url, no padding):")
print(private_key_b64)
print("\nPrivate Key PEM (for reference):")
print(private_pem.decode())

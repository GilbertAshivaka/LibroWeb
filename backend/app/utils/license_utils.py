"""
License and organization ID generation utilities.
"""
import secrets
import string


def generate_license_key() -> str:
    """
    Generate a unique license key in format: XXXX-XXXX-XXXX-XXXX
    Uses uppercase letters and digits for readability.
    """
    chars = string.ascii_uppercase + string.digits
    # Remove confusing characters (0, O, 1, I, L)
    chars = chars.replace('0', '').replace('O', '').replace('1', '').replace('I', '').replace('L', '')
    
    segments = []
    for _ in range(4):
        segment = ''.join(secrets.choice(chars) for _ in range(4))
        segments.append(segment)
    
    return '-'.join(segments)


def generate_organization_id() -> str:
    """
    Generate a unique organization ID in format: ORG-XXXXX
    Uses digits only for simplicity.
    """
    # Generate 5 random digits
    number = secrets.randbelow(100000)
    return f"ORG-{number:05d}"


def validate_license_key_format(key: str) -> bool:
    """Validate that a license key matches the expected format."""
    if not key:
        return False
    
    parts = key.split('-')
    if len(parts) != 4:
        return False
    
    for part in parts:
        if len(part) != 4:
            return False
        if not part.isalnum():
            return False
    
    return True


def validate_organization_id_format(org_id: str) -> bool:
    """Validate that an organization ID matches the expected format."""
    if not org_id:
        return False
    
    if not org_id.startswith('ORG-'):
        return False
    
    number_part = org_id[4:]
    if len(number_part) != 5:
        return False
    
    if not number_part.isdigit():
        return False
    
    return True

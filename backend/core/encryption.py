import os
import base64
import json
import hashlib
from typing import Union, Dict, Any
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from core.config import settings

def _get_encryption_key() -> bytes:
    """
    Retrieves or derives a 32-byte (256-bit) key for AES-256-GCM.
    Uses ENCRYPTION_KEY if set; otherwise derives using SHA-256 over SUPABASE_SECRET_KEY.
    """
    raw = settings.ENCRYPTION_KEY or settings.SUPABASE_SECRET_KEY or "skillweave-secure-default-key-32bytes"
    return hashlib.sha256(raw.encode("utf-8")).digest()

def encrypt_data(data: Union[str, Dict[str, Any], list]) -> Dict[str, Any]:
    """
    Encrypts sensitive data using authenticated AES-256-GCM.
    Returns versioned envelope with IV, ciphertext, and GCM authentication tag.
    """
    if data is None:
        return None
        
    if isinstance(data, (dict, list)):
        plaintext = json.dumps(data, ensure_ascii=False).encode("utf-8")
    else:
        plaintext = str(data).encode("utf-8")
        
    key = _get_encryption_key()
    aesgcm = AESGCM(key)
    
    # 12-byte standard GCM nonce
    nonce = os.urandom(12)
    
    # AESGCM.encrypt in cryptography appends the 16-byte authentication tag to ciphertext
    ciphertext_with_tag = aesgcm.encrypt(nonce, plaintext, associated_data=b"skillweave_v1")
    
    ciphertext = ciphertext_with_tag[:-16]
    tag = ciphertext_with_tag[-16:]
    
    return {
        "version": 1,
        "algorithm": "AES-256-GCM",
        "iv": base64.b64encode(nonce).decode("utf-8"),
        "tag": base64.b64encode(tag).decode("utf-8"),
        "ciphertext": base64.b64encode(ciphertext).decode("utf-8")
    }

def decrypt_data(envelope: Dict[str, Any]) -> Union[str, Dict[str, Any]]:
    """
    Decrypts an AES-256-GCM envelope.
    Verifies authentication tag; raises ValueError on tampering or invalid key.
    """
    if not envelope or not isinstance(envelope, dict):
        return envelope
        
    try:
        version = envelope.get("version", 1)
        if version != 1:
            raise ValueError(f"Unsupported encryption envelope version: {version}")
            
        nonce = base64.b64decode(envelope["iv"])
        tag = base64.b64decode(envelope["tag"])
        ciphertext = base64.b64decode(envelope["ciphertext"])
        
        ciphertext_with_tag = ciphertext + tag
        key = _get_encryption_key()
        aesgcm = AESGCM(key)
        
        decrypted_bytes = aesgcm.decrypt(nonce, ciphertext_with_tag, associated_data=b"skillweave_v1")
        decrypted_str = decrypted_bytes.decode("utf-8")
        
        # Parse JSON if possible
        try:
            return json.loads(decrypted_str)
        except json.JSONDecodeError:
            return decrypted_str
            
    except Exception as e:
        raise ValueError(f"Decryption failed: authenticity check failed or tampered data ({str(e)})")

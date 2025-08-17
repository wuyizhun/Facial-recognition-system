from django.contrib.auth.hashers import PBKDF2PasswordHasher
import hashlib

class FixedSaltPasswordHasher(PBKDF2PasswordHasher):
    def salt(self):
        # 返回固定的 salt
        return "fixed_salt"

    algorithm = "pbkdf2_sha256"
    iterations = 100000
    digest = hashlib.sha256

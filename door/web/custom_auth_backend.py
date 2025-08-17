from django.contrib.auth.backends import BaseBackend
from web.models import User  # 替換為您的實際應用名稱和自定義模型名稱
from django.contrib.auth.hashers import check_password
from web.custom_password_hasher import FixedSaltPasswordHasher  # 使用您自定義的密碼哈希器

class CustomAuthBackend(BaseBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        try:
            user = User.objects.get(user=username)  # 根據自定義的帳號欄位查詢
            hasher = FixedSaltPasswordHasher()
            # 確認密碼是否匹配
            if user and hasher.verify(password, user.password):
                return user
        except User.DoesNotExist:
            return None

    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None

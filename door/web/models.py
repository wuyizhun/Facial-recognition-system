from django.db import models
from django.contrib.auth.hashers import make_password
import hashlib
from web.custom_password_hasher import FixedSaltPasswordHasher
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone

# 自定義的使用者管理器
class MyUserManager(BaseUserManager):
    def create_user(self, user, password=None, **extra_fields):
        if not user:
            raise ValueError('使用者名稱不得為空')
        user = self.model(user=user, **extra_fields)
        user.set_password(password)  # 使用 Django 的加密方法儲存密碼
        user.save(using=self._db)
        return user

    def create_superuser(self, user, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        return self.create_user(user, password, **extra_fields)

# 自定義的使用者模型
class User(AbstractBaseUser, PermissionsMixin):
    user = models.CharField(max_length=30, unique=True, blank=False, null=False)
    password = models.CharField(max_length=256, blank=False, null=False)
    email = models.EmailField(blank=False, null=False)
    is_active = models.BooleanField(default=True)  # 必須的屬性
    is_staff = models.BooleanField(default=False)  # 必須的屬性

    objects = MyUserManager()

    USERNAME_FIELD = 'user'  # 指定使用者名稱欄位
    REQUIRED_FIELDS = ['email']  # 註冊時必填的欄位

    class Meta:
        db_table = "user"

    def __str__(self):
        return self.user

class YourModel(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    IDENTITY_CHOICES = [
        ('本校學生', '本校學生'),
        ('外校學生', '外校學生'),
        ('行政人員', '行政人員'),
        ('臨時人員', '臨時人員'),
    ]
    identity = models.CharField(max_length=50, choices=IDENTITY_CHOICES, default='all')
    phone = models.CharField(max_length=20, default='')
    email = models.EmailField()
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    photo = models.ImageField(upload_to='photos/')
    is_deleted = models.BooleanField(default=False)

    @property
    def photo_url(self):
        if self.photo:
            return self.photo.url
        return None

    def __str__(self):
        return self.name

class EventRecord(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)
    data_id = models.IntegerField()
    name = models.CharField(max_length=100)
    identity = models.CharField(max_length=100)
    action = models.CharField(max_length=100)

    def __str__(self):
        return self.name

# 修改 Visitor 模型，將 user_id 改為外鍵
class Visitor(models.Model):
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=15)
    user = models.ForeignKey(
        'User',  # 指向 User 模型
        on_delete=models.SET_NULL,  # 設置在 User 刪除時將值設為 NULL
        null=True,  # 允許空值
        blank=True  # 允許表單留空
    )
    timestamp = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name

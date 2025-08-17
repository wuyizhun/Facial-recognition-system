from django import forms
from django.contrib.auth.hashers import make_password
from .models import User,YourModel, Visitor, EventRecord
from web.custom_password_hasher import FixedSaltPasswordHasher
from django.contrib import admin

class UserCreationForm(forms.ModelForm):
    password = forms.CharField(label='Password', widget=forms.PasswordInput, required=False)

    class Meta:
        model = User
        fields = ('user','email','password')

    def clean_password(self):
        password = self.cleaned_data.get("password")
        if not password:
            raise forms.ValidationError("Password is required")
        return password

    def save(self, commit=True):
        user = super().save(commit=False)
        if self.cleaned_data.get("password"):
            user.password = make_password(self.cleaned_data["password"], hasher=FixedSaltPasswordHasher())
        if commit:
            user.save()
        return user

class UserChangeForm(forms.ModelForm):
    password = forms.CharField(label='Password', widget=forms.PasswordInput, required=False)

    class Meta:
        model = User
        fields = '__all__'

    def save(self, commit=True):
        user = super().save(commit=False)
        if self.cleaned_data["password"]:
            user.password = make_password(self.cleaned_data["password"], hasher=FixedSaltPasswordHasher())
        if commit:
            user.save()
        return user

class UserAdmin(admin.ModelAdmin):
    form = UserChangeForm
    add_form = UserCreationForm

    list_display = ('id', 'user', 'email', 'password')
    fieldsets = (
        (None, {'fields': ('user', 'email', 'password')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('user', 'email', 'password'),
        }),
    )
    search_fields = ('user', 'email')
    ordering = ('user',)
    filter_horizontal = ()

    def get_fieldsets(self, request, obj=None):
        if not obj:
            return self.add_fieldsets
        return super().get_fieldsets(request, obj)

    def save_model(self, request, obj, form, change):
        if form.cleaned_data.get('password'):
            raw_password = form.cleaned_data['password']
            hashed_password = make_password(raw_password, hasher=FixedSaltPasswordHasher())
            print(f"User: {form.cleaned_data['user']}")
            print(f"Raw Password: {raw_password}")
            print(f"Hashed Password: {hashed_password}")
        super().save_model(request, obj, form, change)

admin.site.register(User, UserAdmin)




#combine
class YourModelAdmin(admin.ModelAdmin):
    list_display = ('id','photo','name', 'identity', 'phone', 'email','created_at','updated_at')  

admin.site.register(YourModel, YourModelAdmin)

class EventRecordAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'data_id', 'name', 'identity', 'action')
    list_per_page = 10 
admin.site.register(EventRecord,EventRecordAdmin)


#combine

class VisitorAdmin(admin.ModelAdmin):
    list_display = ('user_id','name','phone')  

admin.site.register(Visitor, VisitorAdmin)
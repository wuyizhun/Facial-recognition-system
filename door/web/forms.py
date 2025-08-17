from django import forms
from .models import YourModel, Visitor

class YourModelForm(forms.ModelForm):
    class Meta:
        model = YourModel
        fields = ['name','identity', 'phone', 'email', 'photo']

class VisitorForm(forms.ModelForm):
    class Meta:
        model = Visitor
        fields = ['name', 'phone']
from django.shortcuts import render, redirect
from django.http import HttpResponse, JsonResponse
from .models import User,YourModel, Visitor, EventRecord
from django.contrib.auth.hashers import make_password, check_password
from django.views.decorators.csrf import csrf_exempt
from django.contrib import messages
from web.custom_password_hasher import FixedSaltPasswordHasher
from django.contrib.auth import logout
from django.templatetags.static import static
from django.urls import reverse
import paho.mqtt.client as mqtt
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login as auth_login



#combine
from .forms import YourModelForm, VisitorForm
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_POST
from django.core.exceptions import ObjectDoesNotExist
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.views.decorators.csrf import csrf_exempt
from django.db import transaction
from django.db.models import Min,Max
import face_recognition


#combine


# framework 
from .serializers import UserSerializer
from rest_framework import viewsets

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

# Create your views here.

def header(request):
    return render(request, 'header.html')

@login_required
def log(request, user_id):
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return HttpResponse("User not found", status=404)

    # 傳遞 user_id 和 user 對象到模板
    context = {
        'user': user,
        'user_id': user_id
    }

    return render(request, 'log.html', context)


def login(request):
    if request.method == 'GET':
        return render(request, 'index.html')
    elif request.method == 'POST':
        user = request.POST.get('user', None)
        password = request.POST.get('password', None)

        res_data = {}
        user_obj = authenticate(request, username=user, password=password)  # 使用自定義後端驗證

        if user_obj is not None:
            auth_login(request, user_obj)  # 成功登入使用者
            res_data['status'] = '1'
            res_data['user_id'] = str(user_obj.id)
            print(f"登入成功，user_id: {user_obj.id}")
        else:
            res_data['status'] = '0'
            print(f"登入失敗：帳號或密碼錯誤")

        print(f"返回的 JSON 回應: {res_data}")
        return JsonResponse(res_data)
    return render(request, 'index.html')





#combine
@login_required
def main(request, user_id):
    try:
        user = User.objects.get(id=user_id)
        print(f"接收到的 user_id: {user_id}")
    except User.DoesNotExist:
        # 處理使用者不存在的情況，可以重定向到錯誤頁面或顯示錯誤信息
        return redirect('login')  # 重定向到登入頁面或其他處理方式

    return render(request, 'mainpage.html', {'user': user})

@require_POST
def edit_data(request):
    if request.method == 'POST':
        # 获取表单提交的数据
        id = request.POST.get('id')
        name = request.POST.get('name')
        identity = request.POST.get('identity')
        phone = request.POST.get('phone')
        email = request.POST.get('email')
        photo = request.FILES.get('photo')  # 如果有上传新的照片文件

        try:
            # 获取要修改的对象
            person = get_object_or_404(YourModel, id=id)
            
            # 更新对象的信息
            person.name = name
            person.identity = identity
            person.phone = phone
            person.email = email
            if photo:
                person.photo = photo  # 如果上传了新的照片文件，则更新照片

            # 保存更新后的对象
            person.updated_at = timezone.now()
            person.save()

            # 创建事件记录
            event_record = EventRecord.objects.create(
                timestamp=timezone.now(),
                action='修改資料',
                data_id=person.id,
                name=person.name,
                identity=person.identity
            )

            modified_at = timezone.localtime(person.updated_at).strftime('%Y-%m-%d %H:%M')

            # 将事件记录信息转换为字典
            event_data = {
                'timestamp': timezone.localtime(event_record.timestamp).strftime('%Y-%m-%d %H:%M'),
                'action': event_record.action,
                'data_id': event_record.data_id,
                'name': event_record.name,
                'identity': event_record.identity
            }
            print("修改資料")

            return JsonResponse({
                'success': True,
                'modified_at': modified_at,
                'photo_url': person.photo.url if person.photo else None,  # 返回照片URL，如果有的话
                'event_record': event_data  # 返回事件记录信息
            })
        except ObjectDoesNotExist:
            return JsonResponse({'success': False, 'error': '对象不存在'})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'success': False, 'error': '无效的请求方法'})



def add_data(request):
    if request.method == 'POST':
        # 获取其他表单数据
        name = request.POST.get('name')
        identity = request.POST.get('identity')
        phone = request.POST.get('phone')
        email = request.POST.get('email')
        photo = request.FILES.get('photo')  # 获取上传的照片文件
        
        try:
            # 保存数据到数据库，生成ID
            person = YourModel.objects.create(
                name=name,
                identity=identity,
                phone=phone,
                email=email,
                photo=photo,  # 保存照片到数据库
                created_at=timezone.now(),
                updated_at=timezone.now()
            )
            photo_url = person.photo.url if person.photo else None
            
            # 创建事件记录
            event_record = EventRecord.objects.create(
                timestamp=timezone.now(),
                action='新增資料',
                data_id=person.id,
                name=person.name,
                identity=person.identity
            )
            
            # 将事件记录信息转换为字典
            event_data = {
                'timestamp': timezone.localtime(event_record.timestamp).strftime('%Y-%m-%d %H:%M'),
                'action': event_record.action,
                'data_id': event_record.data_id,
                'name': event_record.name,
                'identity': event_record.identity
            }
            print("新增資料")
            
            # 返回新增的ID以及其他信息和事件记录信息
            return JsonResponse({
                'success': True,
                'id': person.id,  # 返回新增的ID
                'created_at': timezone.localtime(person.created_at).strftime('%Y-%m-%d %H:%M'),  # 将时间格式化为字符串
                'updated_at': timezone.localtime(person.updated_at).strftime('%Y-%m-%d %H:%M'),  # 将时间格式化为字符串
                'photo_url': photo_url,
                'event_record': event_data  # 返回事件记录信息
                })
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'success': False})



def get_earliest_and_latest_date(request):
    # 获取最早和最晚的事件记录日期
    earliest_record = EventRecord.objects.aggregate(Min('timestamp'))['timestamp__min']
    latest_record = EventRecord.objects.aggregate(Max('timestamp'))['timestamp__max']

    # 如果最早和最晚记录日期存在，则转换为本地时间
    if earliest_record:
        min_date = earliest_record.strftime('%Y-%m-%d')
    else:
        min_date = None

    if latest_record:
        max_date = latest_record.strftime('%Y-%m-%d')
    else:
        max_date = None

    # 返回最早和最晚日期作为 JSON 响应
    return JsonResponse({'min_date': min_date, 'max_date': max_date})


def get_event_records(request):
    # 获取请求中的页码参数和日期范围参数
    page = request.GET.get('page', 1)
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    records_per_page = int(request.GET.get('records_per_page', 8))  # 默认每页8条记录

    # 获取事件记录数据
    event_records = EventRecord.objects.all()

    if start_date and end_date:
        # 如果有日期範圍，過濾事件記錄
        start_date = timezone.make_aware(timezone.datetime.strptime(start_date, '%Y-%m-%d'))
        end_date = timezone.make_aware(timezone.datetime.strptime(end_date, '%Y-%m-%d') + timezone.timedelta(days=1))
        event_records = event_records.filter(timestamp__range=(start_date, end_date))

    # 将查询集转换为列表，并格式化 timestamp 字段
    event_records_list = []
    for record in event_records:
        event_records_list.append({
            'timestamp': timezone.localtime(record.timestamp).strftime('%Y-%m-%d %H:%M'),
            'data_id': record.data_id,
            'name': record.name,
            'identity': record.identity,
            'action': record.action
        })

    # 创建分页器对象，按用户指定的每页记录数分页
    paginator = Paginator(event_records_list, records_per_page)
    
    try:
        paged_records = paginator.page(page)
    except PageNotAnInteger:
        # 如果页码不是整数，返回第一页
        paged_records = paginator.page(1)
    except EmptyPage:
        # 如果页码超出范围，返回最后一页
        paged_records = paginator.page(paginator.num_pages)

    response_data = {
        'total_records': paginator.count,  # 返回总记录数
        'records': list(paged_records)
    }

    # 返回 JSON 响应
    return JsonResponse(response_data, safe=False)








def delete_data(request):
    if request.method == 'POST':
        ids = request.POST.getlist('ids[]')
        try:
            with transaction.atomic():
                persons_to_delete = YourModel.objects.filter(id__in=ids)
                
                event_records = []
                for person in persons_to_delete:
                    person.is_deleted = True
                    person.save()  # 保存軟刪除的狀態
                    event_record = EventRecord(
                        timestamp=timezone.now(),
                        action='刪除資料',
                        data_id=person.id,
                        name=person.name,
                        identity=person.identity
                    )
                    event_records.append(event_record)
                
                EventRecord.objects.bulk_create(event_records)
                print("刪除資料")
                
            return JsonResponse({'success': True})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'success': False, 'error': 'Invalid request method'})




@login_required
def get_data(request): 
    all_data = YourModel.objects.filter(is_deleted=False).order_by('id')
    
    per_page = int(request.GET.get('per_page', 5))  # 從請求中獲取每頁顯示的筆數，默認為5
    
    paginator = Paginator(all_data, per_page)
    page = request.GET.get('page')

    try:
        data = paginator.page(page)
    except PageNotAnInteger:
        data = paginator.page(1)
    except EmptyPage:
        data = paginator.page(paginator.num_pages)

    data_list = [{'id': item.id,
                  'name': item.name,
                  'identity': item.identity,
                  'phone': item.phone,
                  'email': item.email,
                  'created_at': timezone.localtime(item.created_at).strftime('%Y-%m-%d %H:%M'),
                  'updated_at': timezone.localtime(item.updated_at).strftime('%Y-%m-%d %H:%M'),
                  'photo_url': item.photo.url if item.photo else ''
                  } for item in data]

    total_data_count = all_data.count()  # 獲取資料庫中所有符合條件的資料筆數

    return JsonResponse({
        'data': data_list,
        'total_pages': paginator.num_pages,
        'total_data_count': total_data_count  # 將總數據筆數也返回到前端
    })




@csrf_exempt
def check_duplicate(request):
    if request.method == 'POST':
        phone = request.POST.get('phone')
        email = request.POST.get('email')
        id = request.POST.get('id')  # 從前端獲取要修改的資料的ID

        # 檢查重複的電話號碼
        duplicate_phone = YourModel.objects.filter(phone=phone).exclude(id=id).exists()

        # 檢查重複的電子郵件
        duplicate_email = YourModel.objects.filter(email=email).exclude(id=id).exists()

        return JsonResponse({'duplicate_phone': duplicate_phone, 'duplicate_email': duplicate_email})
    else:
        return JsonResponse({'error': 'Invalid request method'}, status=400)





def search_view(request):
    if request.method == 'GET':
        name = request.GET.get('name', '').strip()
        identity = request.GET.get('identity', '').strip()
        phone = request.GET.get('phone', '').strip()
        page = request.GET.get('page', 1)
        per_page = request.GET.get('per_page', 5)  # 获取每页显示条数，默认为5

        # 构建查询条件，包括软删除的判断
        filters = {
            'is_deleted': False,  # 只查询未软删除的记录
        }

        if name:
            filters['name__icontains'] = name
        if identity:
            filters['identity__icontains'] = identity
        if phone:
            filters['phone__icontains'] = phone

        results = YourModel.objects.filter(**filters).order_by('id')

        # 创建分页对象
        paginator = Paginator(results, per_page)

        try:
            paginated_results = paginator.page(page)
        except PageNotAnInteger:
            paginated_results = paginator.page(1)
        except EmptyPage:
            paginated_results = paginator.page(paginator.num_pages)

        # 构建 JSON 格式的返回数据
        total_data_count = results.count()
        data = {
            'results': [
                {
                    'id': str(item.id),
                    'name': item.name,
                    'identity': item.identity,
                    'phone': item.phone,
                    'email': item.email,
                    'created_at': timezone.localtime(item.created_at).strftime('%Y-%m-%d %H:%M'),
                    'updated_at': timezone.localtime(item.updated_at).strftime('%Y-%m-%d %H:%M'),
                    'photo_url': item.photo.url if item.photo else None
                } for item in paginated_results
            ],
            'total_data_count': total_data_count,  # 返回总数据条数
            'total_pages': paginator.num_pages,
            'current_page': paginated_results.number
        }

        # 记录搜索事件
        if any([name, identity, phone]):
            if identity and not name and not phone:
                EventRecord.objects.create(
                    data_id='000', 
                    name='所有人',
                    identity=identity,
                    action="搜尋資料"
                )
            elif results.exists():
                first_result = results.first()
                EventRecord.objects.create(
                    data_id=str(first_result.id),
                    name=first_result.name,
                    identity=first_result.identity,
                    action=f"搜尋資料"
                )
            else:
                EventRecord.objects.create(
                    data_id='000',  
                    name=name if name else '未提供',
                    identity=identity if identity else '未提供',
                    action=f"查無此資料"
                )
            print("搜尋資料")

        return JsonResponse(data, safe=False)
def open_door(request):
    if request.method == 'POST':
        data_id = request.POST.get('id')
        
        try:
            person = YourModel.objects.get(id=data_id)
            
            # 記錄開門事件
            event_record = EventRecord.objects.create(
                timestamp=timezone.now(),
                action='開門',
                data_id=person.id,
                name=person.name,
                identity=person.identity
            )
            
            # 返回成功信息
            return JsonResponse({'success': True})
        except YourModel.DoesNotExist:
            return JsonResponse({'success': False, 'error': '該ID對應的記錄不存在'})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'success': False, 'error': '無效的請求方法'})

def check_image(request):
    if request.method == 'POST':
        photo = request.FILES.get('photo')

        if photo:
            image = face_recognition.load_image_file(photo)
            face_locations = face_recognition.face_locations(image)

            if len(face_locations) == 0:
                return JsonResponse({'error': '上传的图像不是人像'}, status=400)

        return JsonResponse({'success': True})

    return JsonResponse({'error': '无效的请求'}, status=400)
#combine
mqtt_client = mqtt.Client()

# 定義連接 MQTT 的函數
def connect_mqtt():
    try:
        if not mqtt_client.is_connected():  # 檢查是否已經連接，避免重複連接
            mqtt_client.connect("192.168.31.177", 1883, 60)  # 替換為正確的 MQTT 伺服器設定
            mqtt_client.loop_start()  # 啟動循環以保持連接
            print("成功連接到 MQTT 伺服器")
    except Exception as e:
        print(f"MQTT 連接失敗: {e}")

# 定義發佈消息的函數
def publish_message(topic, message):
    try:
        connect_mqtt()  # 確保連接在發送消息前進行
        mqtt_client.publish(topic, message)
        print(f"已發佈 MQTT 消息: {message} 到主題: {topic}")
    except Exception as e:
        print(f"MQTT 發布消息失敗: {e}")

# 修改的 opendoor 函數
@login_required
def opendoor(request, user_id):
    image_url = static('images/dooropen_background3.jpg')
    home_url = f"/main/{user_id}/"

    if request.method == 'POST':
        action = request.POST.get('action')  # 取得是開門還是關門動作
        visitor_name = request.POST.get('name', user_id)

        if not visitor_name:  # 如果訪客名稱未提供
            visitor_name = f'管理者ID:{user_id}'  # 使用 user_id 作為預設值

        # 根據動作發佈 MQTT 消息
        if action == "開門":
            publish_message("door/control", "open")  # 發佈開門消息
        elif action == "關門":
            publish_message("door/control", "close")  # 發佈關門消息

        # 紀錄事件
        latest_record = EventRecord.objects.order_by('-data_id').first()
        next_data_id = latest_record.data_id + 1 if latest_record else 1 

        EventRecord.objects.create(
            timestamp=timezone.now(),
            action=action,
            data_id=next_data_id,
            name=visitor_name,
            identity='訪客',
        )
        
        return JsonResponse({'success': True, 'message': f'{action} 成功'})
    
    context = {
        'image_url': image_url,
        'home_url': home_url,
    }
    
    return render(request, 'opendoor.html', context)


def submit_visitor(request, user_id):
    print(f"Received user_id: {user_id}")  # 確認收到的 user_id

    if request.method == 'POST':
        form = VisitorForm(request.POST)
        if form.is_valid():
            visitor = form.save(commit=False)
            visitor.user_id = user_id  # 設定 user_id
            visitor.save()  # 保存訪客資料
            return JsonResponse({'success': True, 'user_id': user_id})
        else:
            print(f"Form errors: {form.errors}")  # 打印表單錯誤
            return JsonResponse({'success': False, 'errors': form.errors})
    return JsonResponse({'success': False, 'error': 'Invalid request method'})



def loginout(request):
    # 清除用戶 session
    logout(request)
    
    # 重定向到登入頁面
    return redirect('/login/')
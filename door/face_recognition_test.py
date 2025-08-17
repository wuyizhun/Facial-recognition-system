import os
import face_recognition
import cv2
import time

# 設定資料夾路徑
dirPath = 'C:\\Users\\User\\Desktop\\Door\\door\\media\\photos'

# 獲取資料夾中的檔案列表
result = [f for f in os.listdir(dirPath) if os.path.isfile(os.path.join(dirPath, f))]

# 初始化相機
camera = cv2.VideoCapture(0)

# 確保相機已經成功打開
if not camera.isOpened():
    print("無法打開相機")
    exit()

print("請在鏡頭前站好，以便捕捉你的臉部圖像...")

# 設定偵測人臉的最大等待時間 (5秒)
timeout = 5
start_time = time.time()

while True:
    ret, frame = camera.read()
    if not ret:
        print("無法從相機讀取圖像")
        camera.release()
        exit()

    # 將捕獲的圖像轉換為 RGB
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    # 嘗試從當前幀中檢測人臉
    new_encoding = face_recognition.face_encodings(rgb_frame)

    if new_encoding:
        new_encoding = new_encoding[0]
        print("檢測到人臉，開始比對...")

        # 用於存儲要寫入檔案的文字列表
        writeText = []
        # 用於記錄是否找到相似人臉的變數
        found_similar_face = False

        # 遍歷資料夾中的檔案
        for file in result:
            img_path = os.path.join(dirPath, file)
            img = cv2.imread(img_path)
            rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            known_encoding = face_recognition.face_encodings(rgb_img)

            if known_encoding:
                # 獲取已知圖片的編碼
                know_encodings = [known_encoding[0]]

                # 計算距離並比較人臉
                distance = face_recognition.face_distance(know_encodings, new_encoding)
                result = face_recognition.compare_faces(know_encodings, new_encoding, tolerance=0.6)

                yesOrNo = (str(int(result[0])) if result else '0')
                writeText.append(file + ',' + yesOrNo + ',' + str(round((1 - distance)[0], 4)))

                # 如果找到相似人臉，打印檔案名稱
                if result[0]:
                    print(f"找到相似人臉：{file}")
                    found_similar_face = True

        # 如果沒有找到相似人臉，打印訊息
        if not found_similar_face:
            print("沒有找到相似的人臉")

        # 將結果寫入檔案
        str1 = "\n".join(writeText) + '\n'
        print(str1)
        with open('FaceDatas.txt', 'a') as f:
            f.write(str1)

        # 跳出循環，結束相機捕捉
        break

    # 計算經過的時間
    elapsed_time = time.time() - start_time
    if elapsed_time > timeout:
        print(f"超過 {timeout} 秒未檢測到人臉，自動關閉相機")
        break

# 釋放相機
camera.release()
cv2.destroyAllWindows()

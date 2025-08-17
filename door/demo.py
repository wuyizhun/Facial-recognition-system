import sys
import cv2
import face_recognition
from PyQt5.QtWidgets import QApplication, QWidget, QVBoxLayout, QLabel
from PyQt5.QtCore import QTimer
from PyQt5.QtGui import QImage, QPixmap, QColor, QPalette
from PIL import Image, ImageDraw, ImageFont
import os
import numpy as np


class CameraApp(QWidget):
    def __init__(self):
        super().__init__()

        self.setWindowTitle('攝影機視窗')
        self.setFixedSize(660, 600)

        self.setAutoFillBackground(True)
        palette = self.palette()
        palette.setColor(QPalette.Window, QColor(30, 30, 30))
        self.setPalette(palette)

        # 只顯示攝影機畫面的 QLabel
        self.label = QLabel(self)
        self.label.setFixedSize(640, 480)
        self.label.setStyleSheet("background-color: black; border: 2px solid #4CAF50;")
        self.label.setVisible(True)

        layout = QVBoxLayout()
        layout.addWidget(self.label)
        self.setLayout(layout)

        self.cap = None
        self.timer = QTimer()

        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        self.known_face_encodings = []
        self.known_face_names = []
        self.load_known_faces()



        # 自動開啟攝影機
        self.start_camera()

    def load_known_faces(self):
        known_faces_dir = "C:\\Users\\user\\desktop\\1014\\door\\door\\media\\photos"
        for file_name in os.listdir(known_faces_dir):
            image_path = os.path.join(known_faces_dir, file_name)
            image = face_recognition.load_image_file(image_path)
            encodings = face_recognition.face_encodings(image)
            if len(encodings) > 0:
                avg_encoding = np.mean(encodings, axis=0)
                self.known_face_encodings.append(avg_encoding)
                self.known_face_names.append(file_name.split(".")[0])

    def start_camera(self):
        self.cap = cv2.VideoCapture(0)
        if not self.cap.isOpened():
            print("無法開啟攝影機")
            return
        self.timer.timeout.connect(self.update_frame)
        self.timer.start(20)

    def update_frame(self):
        ret, frame = self.cap.read()
        if ret:
            rgb_image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            face_locations = face_recognition.face_locations(rgb_image)
            face_encodings = face_recognition.face_encodings(rgb_image, face_locations)
            face_names = []

            for face_encoding in face_encodings:
                matches = face_recognition.compare_faces(self.known_face_encodings, face_encoding, tolerance=0.5)
                name = "辨識失敗"
                face_distances = face_recognition.face_distance(self.known_face_encodings, face_encoding)
                best_match_index = np.argmin(face_distances)
                if matches[best_match_index] and face_distances[best_match_index] < 0.5:
                    name = "辨識成功"


                face_names.append(name)

            self.draw_faces_on_frame(frame, face_locations, face_names)

    def draw_faces_on_frame(self, frame, face_locations, face_names):
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        pil_image = Image.fromarray(rgb_frame)
        draw = ImageDraw.Draw(pil_image)

        font_path = "C:/Windows/Fonts/msjh.ttc"
        font = ImageFont.truetype(font_path, 20)
        for (top, right, bottom, left), name in zip(face_locations, face_names):
            color = (0, 255, 0) if name != "辨識失敗" else (255, 0, 0)
            draw.rectangle([left, top, right, bottom], outline=color, width=4)
            draw.text((left, top - 30), name, font=font, fill=color)

        cv_image_with_text = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
        qt_image = self.convert_cv_qt(cv_image_with_text)
        self.label.setPixmap(qt_image)

    def convert_cv_qt(self, cv_img):
        rgb_image = cv2.cvtColor(cv_img, cv2.COLOR_BGR2RGB)
        h, w, ch = rgb_image.shape
        bytes_per_line = ch * w
        return QPixmap.fromImage(QImage(rgb_image.data, w, h, bytes_per_line, QImage.Format_RGB888))
    

    def closeEvent(self, event):
        if self.cap:
            self.cap.release()
        self.timer.stop()
        self.mqttc.disconnect()
        self.mqttc.loop_stop()


# 建立應用程式實例
app = QApplication(sys.argv)
window = CameraApp()
window.show()
sys.exit(app.exec_())

# Generated by Django 5.1.4 on 2025-01-23 21:47

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0006_remove_course_drive_folder_id_and_more"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="course",
            name="introduction_video_thumbnail",
        ),
        migrations.RemoveField(
            model_name="course",
            name="video_duration",
        ),
    ]

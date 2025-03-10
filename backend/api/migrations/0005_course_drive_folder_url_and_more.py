# Generated by Django 5.1.4 on 2025-01-23 21:37

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0004_course_drive_folder_id_course_drive_images_folder_id_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="course",
            name="drive_folder_url",
            field=models.URLField(blank=True, max_length=500, null=True),
        ),
        migrations.AddField(
            model_name="course",
            name="drive_images_folder_url",
            field=models.URLField(blank=True, max_length=500, null=True),
        ),
        migrations.AddField(
            model_name="course",
            name="image_view_url",
            field=models.URLField(blank=True, max_length=500, null=True),
        ),
    ]

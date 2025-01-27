# Generated by Django 5.1.4 on 2025-01-23 21:45

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0005_course_drive_folder_url_and_more"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="course",
            name="drive_folder_id",
        ),
        migrations.RemoveField(
            model_name="course",
            name="drive_folder_url",
        ),
        migrations.RemoveField(
            model_name="course",
            name="drive_images_folder_id",
        ),
        migrations.RemoveField(
            model_name="course",
            name="drive_images_folder_url",
        ),
        migrations.RemoveField(
            model_name="course",
            name="image",
        ),
        migrations.RemoveField(
            model_name="course",
            name="image_storage_type",
        ),
        migrations.RemoveField(
            model_name="course",
            name="storage_type",
        ),
        migrations.RemoveField(
            model_name="course",
            name="video_url",
        ),
        migrations.CreateModel(
            name="CourseFileManager",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "drive_folder_id",
                    models.CharField(blank=True, max_length=100, null=True),
                ),
                (
                    "drive_images_folder_id",
                    models.CharField(blank=True, max_length=100, null=True),
                ),
                (
                    "drive_folder_url",
                    models.URLField(blank=True, max_length=500, null=True),
                ),
                (
                    "drive_images_folder_url",
                    models.URLField(blank=True, max_length=500, null=True),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "course",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="file_manager",
                        to="api.course",
                    ),
                ),
            ],
            options={
                "verbose_name": "Course File Manager",
                "verbose_name_plural": "Course File Managers",
                "db_table": "course_file_managers",
            },
        ),
    ]

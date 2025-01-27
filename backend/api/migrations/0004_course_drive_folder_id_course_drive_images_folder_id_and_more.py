# Generated by Django 5.1.4 on 2025-01-23 18:35

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0003_alter_course_options_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="course",
            name="drive_folder_id",
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name="course",
            name="drive_images_folder_id",
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AlterField(
            model_name="course",
            name="image",
            field=models.FileField(blank=True, null=True, upload_to="course_images/"),
        ),
    ]

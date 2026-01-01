#!/usr/bin/env python3
"""
QuickLaundry Backend Setup Script
This script helps you set up the backend environment
"""

import os
import sys
import subprocess
import getpass


def print_header(text):
    """Print a formatted header"""
    print("\n" + "="*60)
    print(f"  {text}")
    print("="*60 + "\n")


def print_step(step, text):
    """Print a step"""
    print(f"[{step}] {text}")


def create_env_file():
    """Create .env file with user input"""
    print_header("Creating .env Configuration File")
    
    env_content = []
    
    # Flask Configuration
    print_step(1, "Flask Configuration")
    secret_key = input("Enter SECRET_KEY (press Enter for default): ").strip()
    if not secret_key:
        import secrets
        secret_key = secrets.token_hex(32)
    env_content.append(f"SECRET_KEY={secret_key}")
    env_content.append("DEBUG=True")
    
    # Database Configuration
    print("\n")
    print_step(2, "Database Configuration")
    db_host = input("Database Host (default: localhost): ").strip() or "localhost"
    db_user = input("Database User (default: root): ").strip() or "root"
    db_password = getpass.getpass("Database Password: ").strip()
    db_name = input("Database Name (default: quicklaundry_db): ").strip() or "quicklaundry_db"
    db_port = input("Database Port (default: 3306): ").strip() or "3306"
    
    env_content.append(f"\nDB_HOST={db_host}")
    env_content.append(f"DB_USER={db_user}")
    env_content.append(f"DB_PASSWORD={db_password}")
    env_content.append(f"DB_NAME={db_name}")
    env_content.append(f"DB_PORT={db_port}")
    
    # JWT Configuration
    print("\n")
    print_step(3, "JWT Configuration")
    jwt_secret = input("Enter JWT_SECRET_KEY (press Enter for default): ").strip()
    if not jwt_secret:
        import secrets
        jwt_secret = secrets.token_hex(32)
    env_content.append(f"\nJWT_SECRET_KEY={jwt_secret}")
    
    # Email Configuration
    print("\n")
    print_step(4, "Email Configuration (Gmail)")
    print("Note: You need a Gmail App Password (not your regular password)")
    print("Instructions: https://support.google.com/accounts/answer/185833")
    mail_username = input("Gmail Address: ").strip()
    mail_password = getpass.getpass("Gmail App Password: ").strip()
    
    env_content.append(f"\nMAIL_SERVER=smtp.gmail.com")
    env_content.append(f"MAIL_PORT=587")
    env_content.append(f"MAIL_USE_TLS=True")
    env_content.append(f"MAIL_USERNAME={mail_username}")
    env_content.append(f"MAIL_PASSWORD={mail_password}")
    env_content.append(f"MAIL_DEFAULT_SENDER=QuickLaundry <{mail_username}>")
    
    # OTP Configuration
    env_content.append(f"\nOTP_EXPIRY_MINUTES=10")
    
    # CORS Configuration
    print("\n")
    print_step(5, "CORS Configuration")
    cors_origins = input("Frontend URL (default: http://localhost:5500): ").strip()
    if not cors_origins:
        cors_origins = "http://localhost:5500,http://127.0.0.1:5500"
    env_content.append(f"\nCORS_ORIGINS={cors_origins}")
    
    # Application Configuration
    app_url = input("Application URL (default: http://localhost:5500): ").strip() or "http://localhost:5500"
    env_content.append(f"\nAPP_URL={app_url}")
    
    # Write to .env file
    with open('.env', 'w') as f:
        f.write('\n'.join(env_content))
    
    print("\n✓ .env file created successfully!")
    
    return db_name


def create_database(db_name):
    """Create MySQL database"""
    print_header("Creating MySQL Database")
    
    create_db = input(f"\nDo you want to create the database '{db_name}'? (y/n): ").strip().lower()
    
    if create_db == 'y':
        try:
            import mysql.connector
            from decouple import config
            
            # Load .env
            from dotenv import load_dotenv
            load_dotenv()
            
            connection = mysql.connector.connect(
                host=os.getenv('DB_HOST'),
                user=os.getenv('DB_USER'),
                password=os.getenv('DB_PASSWORD')
            )
            
            cursor = connection.cursor()
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
            
            cursor.close()
            connection.close()
            
            print(f"✓ Database '{db_name}' created successfully!")
            
        except Exception as e:
            print(f"✗ Error creating database: {e}")
            print("Please create the database manually:")
            print(f"  CREATE DATABASE {db_name} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
    else:
        print("Skipping database creation. Please create it manually.")


def install_dependencies():
    """Install Python dependencies"""
    print_header("Installing Python Dependencies")
    
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("\n✓ Dependencies installed successfully!")
    except subprocess.CalledProcessError as e:
        print(f"✗ Error installing dependencies: {e}")
        sys.exit(1)


def create_folders():
    """Create necessary folders"""
    print_header("Creating Necessary Folders")
    
    folders = [
        'uploads',
        'uploads/profile_pictures',
        'logs'
    ]
    
    for folder in folders:
        if not os.path.exists(folder):
            os.makedirs(folder)
            print(f"✓ Created folder: {folder}")
        else:
            print(f"- Folder already exists: {folder}")


def main():
    """Main setup function"""
    print_header("QuickLaundry Backend Setup")
    print("This script will help you set up your backend environment.")
    print("Please have the following information ready:")
    print("  - MySQL database credentials")
    print("  - Gmail account with App Password enabled")
    
    input("\nPress Enter to continue...")
    
    # Check if .env already exists
    if os.path.exists('.env'):
        overwrite = input("\n.env file already exists. Overwrite? (y/n): ").strip().lower()
        if overwrite != 'y':
            print("Setup cancelled.")
            sys.exit(0)
    
    # Create .env file
    db_name = create_env_file()
    
    # Install dependencies
    install_dependencies()
    
    # Create database
    create_database(db_name)
    
    # Create folders
    create_folders()
    
    # Final instructions
    print_header("Setup Complete!")
    print("Your backend is now configured. To start the server:")
    print("\n  python app.py")
    print("\nThe server will start on http://localhost:3000")
    print("\nAPI Endpoints:")
    print("  - POST /api/send-otp")
    print("  - POST /api/verify-otp")
    print("  - POST /api/register")
    print("  - POST /api/login")
    print("\nFor more information, see README.md")
    print("\n" + "="*60 + "\n")


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nSetup cancelled by user.")
        sys.exit(0)
    except Exception as e:
        print(f"\n✗ Setup failed: {e}")
        sys.exit(1)
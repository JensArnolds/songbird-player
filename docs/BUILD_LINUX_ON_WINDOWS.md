# Building Linux Packages on Windows 11

This guide explains how to build Starchild for Linux while developing on Windows 11 using WSL2.

## Prerequisites

- Windows 11
- Administrator access
- At least 10GB free disk space

## Setup: WSL2 + Ubuntu 24.04

This is the most reliable method and provides the best compatibility for building all Linux package formats (.deb, .rpm, AppImage).

### Step 1: Install WSL2

Open PowerShell as Administrator and run:

```powershell
wsl --install
```

This will:
- Enable WSL2
- Install Ubuntu 24.04 LTS (default)
- Set up a Linux kernel

**Restart your computer after installation.**

### Step 2: Initial Ubuntu Setup

After restart, Ubuntu will open automatically. Create your Linux user:

```bash
# You'll be prompted for:
# - Username (can be the same as Windows)
# - Password (can be different from Windows)
```

### Step 3: Update Ubuntu

```bash
sudo apt update && sudo apt upgrade -y
```

### Step 4: Install Node.js 20.x

```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x or higher
```

### Step 5: Install Build Dependencies

```bash
sudo apt-get install -y \
  build-essential \
  libssl-dev \
  rpm \
  fakeroot \
  dpkg \
  git
```

### Step 6: Navigate to Your Project

Windows drives are mounted at `/mnt/` in WSL:

```bash
# Navigate to your project
cd /mnt/d/Workspace/Web/Next.JS/bluesix-library

# Verify you're in the right place
pwd
ls -la package.json
```

### Step 7: Install Dependencies

```bash
npm install
```

### Step 8: Build for Linux

```bash
npm run electron:build:linux
```

This will create:
- `dist/Starchild.AppImage` - Universal Linux package (recommended)
- `dist/Starchild.deb` - Debian/Ubuntu package
- Build artifacts and metadata

### Build Output

After a successful build, you'll find:

```
dist/
├── Starchild.AppImage          # Universal Linux binary (recommended)
├── Starchild.deb               # Debian/Ubuntu package
├── builder-debug.yml
├── builder-effective-config.yaml
├── latest-linux.yml            # Auto-update metadata
└── linux-unpacked/             # Unpacked build files
```

## Tips for WSL2

### File System Performance

For best performance, work directly in the WSL2 filesystem:

```bash
# Clone your project inside WSL2 (faster builds)
cd ~
git clone https://github.com/soulwax/bluesix-library.git
cd bluesix-library
```

Or continue using Windows filesystem (easier file access from Windows apps):
```bash
cd /mnt/d/Workspace/Web/Next.JS/bluesix-library
```

### Access WSL Files from Windows

Open WSL location in Windows Explorer:
```bash
explorer.exe .
```

Or navigate to: `\\wsl$\Ubuntu-24.04\home\<username>\`

### VS Code Integration

Install the "WSL" extension in VS Code to edit files directly in WSL2:

1. Open VS Code on Windows
2. Install "WSL" extension
3. Click the green button in bottom-left corner
4. Select "New WSL Window"
5. Open your project folder

### Common Commands

```bash
# Start WSL from PowerShell/CMD
wsl

# Shut down WSL
wsl --shutdown

# Check WSL status
wsl --status

# List installed distributions
wsl --list --verbose

# Set default distribution
wsl --set-default Ubuntu-24.04
```

## GitHub Actions for CI/CD (Optional)

Set up automated builds on every release:

See `.github/workflows/build-electron.yml` for a complete CI/CD example that builds for Windows, macOS, and Linux automatically.

## Troubleshooting

### "Cannot find module" errors in WSL

```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Permission errors

```bash
# Fix ownership of project files
sudo chown -R $USER:$USER /path/to/project
```

### Out of memory during build

Increase WSL2 memory limit by creating `C:\Users\<YourUsername>\.wslconfig`:

```ini
[wsl2]
memory=8GB
processors=4
```

Then restart WSL:
```powershell
wsl --shutdown
```

### Build fails with "EACCES" error

```bash
# Clear npm cache
npm cache clean --force

# Rebuild native modules
npm rebuild
```

## Verifying the Build

### Test the AppImage

On a Linux system (or in WSL2 with GUI enabled):

```bash
chmod +x dist/Starchild.AppImage
./dist/Starchild.AppImage
```

### Test the .deb package

On Ubuntu/Debian:

```bash
sudo dpkg -i dist/Starchild.deb
sudo apt-get install -f  # Fix dependencies if needed
starchild
```

## Distribution

### AppImage (Recommended)

- **Pros**: Universal, no installation required, works on all Linux distros
- **Cons**: Larger file size
- **Usage**: Users just download and run

### .deb Package

- **Pros**: Integrates with system package manager, smaller size
- **Cons**: Only works on Debian/Ubuntu-based systems
- **Usage**: Users install with `sudo dpkg -i` or double-click

## Resources

- [electron-builder documentation](https://www.electron.build/)
- [WSL2 documentation](https://docs.microsoft.com/en-us/windows/wsl/)
- [Node.js on WSL2](https://docs.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-wsl)

/**
 * Installation-guide builder — SINGLE SOURCE OF TRUTH for install content.
 *
 * Takes a distro object ({ id, name, pkgMgr, basedOn, downloadUrl }) and
 * returns { normal, dual, vm } guide modes with step-by-step instructions.
 * Stored per-distro in MongoDB (see seed.js) and served via
 * GET /api/distros/:id as `installGuide`. The frontend only *renders*
 * this data — no install content is hardcoded in the client.
 *
 * NOTE: `icon` is a string key ('laptop' | 'split' | 'box') because guide
 * data crosses the API as JSON. The frontend maps keys -> Lucide components.
 */
export const buildInstallGuide = (distro) => {
  const updateCmd =
    distro.pkgMgr === 'apt'
      ? 'sudo apt update && sudo apt upgrade -y'
      : distro.pkgMgr === 'pacman'
      ? 'sudo pacman -Syu'
      : distro.pkgMgr === 'dnf'
      ? 'sudo dnf upgrade --refresh -y'
      : distro.pkgMgr === 'zypper'
      ? 'sudo zypper refresh && sudo zypper dup'
      : distro.installCmd || 'sudo apt update';

  const guestAdditionsCmd =
    distro.pkgMgr === 'apt'
      ? 'sudo apt update && sudo apt install -y virtualbox-guest-x11'
      : distro.pkgMgr === 'pacman'
      ? 'sudo pacman -S --noconfirm virtualbox-guest-utils && sudo systemctl enable --now vboxservice'
      : distro.pkgMgr === 'dnf'
      ? 'sudo dnf install -y virtualbox-guest-additions'
      : 'sudo apt install -y virtualbox-guest-x11';

  return {
    normal: {
      id: 'normal',
      title: 'Normal Boot (Clean Single OS)',
      badge: 'Dedicated Machine • Complete Replacement',
      icon: 'laptop',
      time: '15-20 mins',
      risk: 'Erases Target Disk / Partition',
      riskColor: '#F59E0B',
      requirements: ['8GB+ USB Flash Drive', '25GB+ Free Storage', 'Complete Backup of Current Data'],
      description: `Install ${distro.name} as your sole primary operating system directly on bare metal hardware for maximum performance, battery efficiency, and responsiveness.`,
      steps: [
        {
          num: '01',
          title: `Download Official ${distro.name} ISO Image`,
          desc: `Acquire the latest official 64-bit desktop ISO release for ${distro.name}. Ensure the downloaded file matches official release integrity checksums.`,
          action: distro.downloadUrl ? { label: `Download ${distro.name} ISO`, url: distro.downloadUrl } : null,
          cmd: `sha256sum ${distro.id || distro.distroId || 'distro'}-desktop-latest.iso`,
          cmdLabel: 'Verify SHA256 Checksum (Linux/macOS Terminal):',
          tip: 'Always download Linux ISOs from official mirrors or torrents to verify cryptographic authenticity.',
          image: '/install-guide/normal_step1_download.png',
          imageCaption: `Select and download official 64-bit desktop ISO release for ${distro.name}`
        },
        {
          num: '02',
          title: 'Create a Bootable USB Flash Drive',
          desc: 'Flash the downloaded ISO onto a USB flash drive (minimum 8 GB). All existing data on this USB stick will be erased.',
          tools: ['BalenaEtcher (Cross-platform GUI)', 'Rufus (Windows: choose GPT & UEFI)', 'Raspberry Pi Imager', 'Ventoy'],
          cmd: `sudo dd if=${distro.id || distro.distroId}-latest.iso of=/dev/sdX bs=4M status=progress conv=fsync`,
          cmdLabel: 'Alternative Linux Terminal Flash (Replace /dev/sdX with USB path):',
          warning: 'Double-check your target USB device path with "lsblk". Writing to the wrong disk identifier will permanently overwrite your data!',
          image: '/install-guide/normal_step2_flash.png',
          imageCaption: 'BalenaEtcher: Select target USB drive and flash bootable installation media'
        },
        {
          num: '03',
          title: 'Boot into UEFI / BIOS Setup',
          desc: 'Insert the bootable USB into your computer and turn it on while repeatedly tapping your motherboard boot menu key.',
          keys: ['F12 (Dell/Lenovo)', 'F11 (MSI)', 'F8 (ASUS)', 'F9 (HP)', 'Del / F2 (BIOS Setup)'],
          tip: 'In your motherboard BIOS: Ensure UEFI Boot Mode is active and disable Fast Boot so the USB drive is promptly detected.',
          image: '/install-guide/normal_step3_uefi.jpg',
          imageCaption: 'Motherboard UEFI Boot Menu: Select USB flash drive as primary boot target'
        },
        {
          num: '04',
          title: `Run Guided Installer & Partition Disk`,
          desc: `Boot into the live desktop environment and click "Install ${distro.name}". Proceed through language, keyboard layout, and timezone configuration.`,
          options: [
            { label: `Erase disk and install ${distro.name}`, detail: 'Recommended for clean installs: automatically creates EFI system partition, root (/), and swap space.' },
            { label: 'Encrypt new installation (LUKS)', detail: 'Optional: Secures full-disk encryption with a boot passphrase for enterprise-level privacy.' }
          ],
          tip: `Provide your user account name and administrator (sudo) password when prompted, then proceed with the installation.`,
          image: '/install-guide/normal_step4_partition.png',
          imageCaption: 'Graphical Installer: Guided installation and automatic disk partitioning wizard'
        },
        {
          num: '05',
          title: 'Reboot & Perform First System Update',
          desc: `When installation completes, click "Restart Now" and remove the USB drive when prompted. Log into your new desktop and update package repositories.`,
          cmd: updateCmd,
          cmdLabel: 'Run First System Update in Terminal:',
          tip: `Congratulations! ${distro.name} is now installed as your primary operating system. Enjoy full hardware acceleration and freedom!`,
          image: '/install-guide/normal_step5_firstboot.png',
          imageCaption: 'First Desktop Boot: System package updater fetching security and stability updates'
        }
      ]
    },
    dual: {
      id: 'dual',
      title: 'Dual Boot (Windows 10/11 + Linux)',
      badge: 'Side-by-Side • Shared Hardware',
      icon: 'split',
      time: '25-35 mins',
      risk: 'Resizes Windows Partition (Moderate)',
      riskColor: '#EC4899',
      requirements: ['40GB+ Free Unallocated Space', '8GB+ USB Drive', 'BitLocker Key Backed Up'],
      description: `Run ${distro.name} side-by-side with your existing Windows installation on the same computer. Select which operating system to start every time you power on via the GRUB boot menu.`,
      steps: [
        {
          num: '01',
          title: 'Shrink Partition in Windows Disk Management',
          desc: 'Boot into Windows and carve out unpartitioned space on your hard drive or SSD for Linux.',
          substeps: [
            'Press Win + X and select "Disk Management" (or press Win + R and type "diskmgmt.msc").',
            'Right-click your main Windows partition (usually C:) and select "Shrink Volume...".',
            'Enter the amount of space to shrink: enter at least 40000 MB (40 GB) up to 100000 MB (100 GB).',
            'Click "Shrink". Crucial: Leave this newly created space as "Unallocated" — do NOT format it as NTFS in Windows!'
          ],
          warning: 'Always create a backup of your personal Windows files before shrinking or modifying storage partitions.',
          image: '/install-guide/dual_step1_diskmgmt.png',
          imageCaption: 'Windows Disk Management: Inspect drive partitions and shrink C: volume to create Unallocated Space'
        },
        {
          num: '02',
          title: 'Disable Windows Fast Startup & BitLocker',
          desc: 'Windows Fast Startup puts system disks into a locked hibernation cache that blocks Linux from safely reading partitions or installing the GRUB bootloader.',
          substeps: [
            'Open Control Panel → Hardware and Sound → Power Options → "Choose what the power buttons do".',
            'Click "Change settings that are currently unavailable".',
            'Uncheck "Turn on fast startup (recommended)" and click Save Changes.',
            'If BitLocker encryption is active on drive C:, suspend BitLocker in Windows settings and keep your 48-digit recovery key accessible.'
          ],
          warning: 'Failing to turn off Fast Startup may lead to read-only disk mounts or filesystem conflicts when switching between operating systems.',
          image: '/install-guide/dual_step2_faststartup.png',
          imageCaption: 'Windows Power Options: Uncheck "Turn on fast startup" to avoid partition hibernation lock'
        },
        {
          num: '03',
          title: 'Flash USB with Rufus (UEFI / GPT)',
          desc: `Flash ${distro.name} ISO using Rufus with the correct partition scheme for modern UEFI machines.`,
          substeps: [
            'Open Rufus on Windows and select your USB flash drive.',
            'Choose the downloaded ISO file.',
            'Partition scheme: Select "GPT".',
            'Target system: Select "UEFI (non-CSM)".',
            'Click Start to write the image.'
          ],
          tip: 'In your PC BIOS setup: Ensure the SATA controller mode is set to AHCI (not Intel RST or RAID mode).',
          image: '/install-guide/dual_step3_rufus.png',
          imageCaption: 'Rufus: Select Partition scheme "GPT" and Target system "UEFI (non-CSM)"'
        },
        {
          num: '04',
          title: `Install ${distro.name} Alongside Windows`,
          desc: 'Boot from your USB flash drive and launch the graphical installer.',
          substeps: [
            `When reaching the Installation Type step, select: "Install ${distro.name} alongside Windows Boot Manager" (recommended automatic mode).`,
            `If choosing Manual Partitioning ("Something else"): Select the Free Unallocated Space, create an EFI partition (if needed), and a Root (/) partition formatted as ext4 or btrfs.`,
            'Ensure the bootloader is placed on the primary disk EFI partition (e.g., /dev/nvme0n1 or /dev/sda).'
          ],
          tip: 'The installer will automatically detect Windows Boot Manager and add an entry into the GRUB bootloader.',
          image: '/install-guide/dual_step4_alongside.png',
          imageCaption: 'Installer Type: Select "Install alongside Windows Boot Manager" for automatic dual-boot config'
        },
        {
          num: '05',
          title: 'Reboot & Select OS via GRUB Menu',
          desc: 'Remove the USB flash drive and restart your PC. The GRUB bootloader menu will now appear on startup, letting you select Linux or Windows.',
          cmd: updateCmd,
          cmdLabel: 'Initial Update Command in Linux:',
          tip: 'If your computer boots straight into Windows, enter BIOS/UEFI settings and move the Linux GRUB entry to the top of your Boot Priority list.',
          image: '/install-guide/dual_step5_grub.png',
          imageCaption: 'GNU GRUB Bootloader: Switch seamlessly between Linux and Windows Boot Manager'
        }
      ]
    },
    vm: {
      id: 'vm',
      title: 'Virtual Machine (Safe Sandbox)',
      badge: '100% Risk-Free • In-Window Testing',
      icon: 'box',
      time: '10-15 mins',
      risk: 'Zero Risk to Host OS',
      riskColor: '#10B981',
      requirements: ['Host PC with 8GB+ RAM', 'VirtualBox / VMware / UTM', 'Hardware Virtualization (VT-x/AMD-V)'],
      description: `Run ${distro.name} safely inside an isolated virtual window on your current Windows, macOS, or Linux desktop without modifying your physical storage drives or bootloader.`,
      steps: [
        {
          num: '01',
          title: 'Install a Virtualization Hypervisor',
          desc: 'Install hypervisor software suited for your host operating system.',
          tools: [
            'Oracle VirtualBox (Free & Open Source for Windows, Mac, Linux)',
            'VMware Workstation Player (Windows & Linux)',
            'UTM (Native high-performance hypervisor for Apple Silicon Mac M1/M2/M3)',
            'Virt-Manager / KVM (Linux Native)'
          ],
          tip: 'Ensure CPU Virtualization (Intel VT-x or AMD-V) is enabled in your BIOS/UEFI settings.',
          image: '/install-guide/vm_step1_virtualbox.png',
          imageCaption: 'Oracle VM VirtualBox: Open-source hypervisor manager for running isolated virtual machines'
        },
        {
          num: '02',
          title: `Create a New Virtual Machine Profile`,
          desc: `Open your hypervisor and click "New" to allocate virtual hardware resources for ${distro.name}.`,
          substeps: [
            `Name: "${distro.name} VM"`,
            `Type: Linux | Version: ${distro.basedOn || 'Ubuntu'} (64-bit)`,
            'Base Memory (RAM): Allocate at least 4096 MB (4 GB). If your host has 16GB+ RAM, assign 6GB-8GB.',
            'Processors: Assign 2 to 4 virtual CPU cores for responsive graphics and app loading.',
            'Virtual Hard Disk: Create a 25 GB to 40 GB dynamically allocated disk (VDI or VMDK format).'
          ],
          action: distro.downloadUrl ? { label: `Download ${distro.name} ISO`, url: distro.downloadUrl } : null,
          image: '/install-guide/vm_step2_profile.png',
          imageCaption: 'Virtual Machine Creation Wizard: Allocate base memory RAM and virtual CPU processor cores'
        },
        {
          num: '03',
          title: 'Attach ISO & Enable Video Acceleration',
          desc: 'Mount the downloaded ISO into the virtual machine optical disc drive and optimize display parameters.',
          substeps: [
            'Go to VM Settings → Storage → Optical Drive → Choose a disk file → select the downloaded ISO.',
            'Go to VM Settings → Display → Increase Video Memory to 128 MB.',
            'Check "Enable 3D Acceleration" (ensures smooth window compositing and desktop animations).'
          ],
          image: '/install-guide/vm_step3_storage.png',
          imageCaption: 'Storage Settings: Mount downloaded Linux ISO to Virtual Optical Drive and allocate video memory'
        },
        {
          num: '04',
          title: 'Power On & Complete In-Window Setup',
          desc: 'Click "Start" to launch the virtual machine. The installer runs safely isolated inside your application window.',
          substeps: [
            'Select "Try or Install" in the virtual boot menu.',
            'Choose "Erase disk and install" — this only touches the virtual disk (.vdi), NOT your physical computer!',
            'Complete username, password, and desktop layout setup, then restart the virtual machine.'
          ],
          tip: 'In VirtualBox, press the Right Control key (Host Key) anytime if your mouse cursor gets trapped inside the VM window.',
          image: '/install-guide/vm_step4_running.png',
          imageCaption: 'Live Installer executing safely inside virtual window without altering host disk partitions'
        },
        {
          num: '05',
          title: 'Install Guest Additions for Seamless Display',
          desc: 'Install hypervisor integration tools to enable automatic window resolution scaling, bidirectional clipboard, and folder sharing.',
          cmd: guestAdditionsCmd,
          cmdLabel: 'Run Inside VM Terminal to Enable Guest Features:',
          substeps: [
            'In VirtualBox top menu: Click Devices → "Insert Guest Additions CD image...".',
            'Run the terminal command above to install native kernel integration packages.',
            'Reboot the virtual machine to enjoy auto-resizing full-screen resolution and shared clipboard!'
          ],
          image: '/install-guide/vm_step5_additions.png',
          imageCaption: 'VirtualBox Guest Additions: Dynamic window resolution auto-fit, clipboard sharing and folders'
        }
      ]
    }
  };
};

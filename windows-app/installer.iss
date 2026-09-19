#define MyAppName "Quotation Studio"
#define MyAppVersion "2.0.0"
#define MyAppPublisher "AbdulAziz Alsari"
#define MyAppExeName "QuotationStudio.exe"

[Setup]
AppId={{C271C343-6A58-45D3-B042-2BDF02C3C85A}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={localappdata}\Programs\Quotation Studio
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
OutputDir=dist
OutputBaseFilename=QuotationStudio-Setup-2.0.0
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
UninstallDisplayIcon={app}\{#MyAppExeName}
ArchitecturesAllowed=x64compatible
SetupLogging=yes

[Languages]
Name: "arabic"; MessagesFile: "compiler:Languages\Arabic.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "إنشاء اختصار على سطح المكتب"; GroupDescription: "اختصارات:"; Flags: checkedonce

[Files]
Source: "QuotationStudio\bin\Release\net48\QuotationStudio.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "QuotationStudio\bin\Release\net48\*.dll"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "QuotationStudio\bin\Release\net48\QuotationStudio.exe.config"; DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "تشغيل {#MyAppName}"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
Type: filesandordirs; Name: "{app}"

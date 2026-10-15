#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <shellapi.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define IDI_APPICON 1

// Check if directory exists
static BOOL DirectoryExists(const char *path) {
    DWORD dwAttrib = GetFileAttributesA(path);
    return (dwAttrib != INVALID_FILE_ATTRIBUTES && (dwAttrib & FILE_ATTRIBUTE_DIRECTORY));
}

// Ensure directory exists without deleting existing contents
static void EnsureDirectory(const char *path) {
    if (!DirectoryExists(path)) {
        CreateDirectoryA(path, NULL);
    }
}

// Check if file exists on disk
static BOOL FileExists(const char *path) {
    DWORD dwAttrib = GetFileAttributesA(path);
    return (dwAttrib != INVALID_FILE_ATTRIBUTES && !(dwAttrib & FILE_ATTRIBUTE_DIRECTORY));
}

// Convert path to file URL: "file:///C:/path/to/file"
static void ConvertPathToFileUrl(const char *inPath, char *outUrl, size_t maxLen) {
    const char *prefix = "file:///";
    size_t prefixLen = strlen(prefix);
    size_t inLen = strlen(inPath);
    size_t outIdx = 0;

    if (maxLen <= prefixLen + inLen) return;

    strcpy(outUrl, prefix);
    outIdx += prefixLen;

    for (size_t i = 0; i < inLen && outIdx + 1 < maxLen; i++) {
        if (inPath[i] == '\\') {
            outUrl[outIdx++] = '/';
        } else {
            outUrl[outIdx++] = inPath[i];
        }
    }
    outUrl[outIdx] = '\0';
}

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
    char exePath[MAX_PATH];
    char dirPath[MAX_PATH];
    char dataDir[MAX_PATH];
    char assetsDir[MAX_PATH];
    char resourcesDir[MAX_PATH];
    char librariesDir[MAX_PATH];
    char targetHtml[MAX_PATH];
    char profileDir[MAX_PATH];
    char fileUrl[MAX_PATH * 2];
    char launchArgs[MAX_PATH * 4];

    // Determine current directory from executable location (100% relative, portable)
    if (GetModuleFileNameA(NULL, exePath, MAX_PATH) == 0) {
        strcpy(dirPath, ".");
    } else {
        char *lastSlash = strrchr(exePath, '\\');
        if (lastSlash) {
            *lastSlash = '\0';
            strncpy(dirPath, exePath, MAX_PATH);
        } else {
            strcpy(dirPath, ".");
        }
    }

    // Automatically create missing required folders without deleting existing data
    snprintf(dataDir, sizeof(dataDir), "%s\\Data", dirPath);
    snprintf(assetsDir, sizeof(assetsDir), "%s\\Assets", dirPath);
    snprintf(resourcesDir, sizeof(resourcesDir), "%s\\Resources", dirPath);
    snprintf(librariesDir, sizeof(librariesDir), "%s\\Libraries", dirPath);

    EnsureDirectory(dataDir);
    EnsureDirectory(assetsDir);
    EnsureDirectory(resourcesDir);
    EnsureDirectory(librariesDir);

    // Dedicated profile directory inside Data/ for 100% portable browser storage
    snprintf(profileDir, sizeof(profileDir), "%s\\Profile", dataDir);
    EnsureDirectory(profileDir);

    // Locate the standalone application HTML file in Resources, root, or parent
    snprintf(targetHtml, sizeof(targetHtml), "%s\\Resources\\TeleNest.html", dirPath);
    if (!FileExists(targetHtml)) {
        snprintf(targetHtml, sizeof(targetHtml), "%s\\Resources\\app.html", dirPath);
    }
    if (!FileExists(targetHtml)) {
        snprintf(targetHtml, sizeof(targetHtml), "%s\\Resources\\TeleNest-Offline-SingleFile.html", dirPath);
    }
    if (!FileExists(targetHtml)) {
        snprintf(targetHtml, sizeof(targetHtml), "%s\\TeleNest-Offline-SingleFile.html", dirPath);
    }
    if (!FileExists(targetHtml)) {
        snprintf(targetHtml, sizeof(targetHtml), "%s\\TeleNest.html", dirPath);
    }

    if (!FileExists(targetHtml)) {
        MessageBoxA(NULL,
            "TeleNest application resources were not found.\n\nPlease ensure the 'Resources' and 'Data' folders are present alongside TeleNest.exe.",
            "TeleNest Portable - Missing Resources",
            MB_ICONINFORMATION | MB_OK);
        return 1;
    }

    ConvertPathToFileUrl(targetHtml, fileUrl, sizeof(fileUrl));

    // Launch Microsoft Edge in modern standalone app mode with portable local profile in Data/
    snprintf(launchArgs, sizeof(launchArgs),
        "--app=\"%s\" --user-data-dir=\"%s\" --window-size=1440,920 --allow-file-access-from-files --disable-features=Translate,OptimizationHints",
        fileUrl, profileDir);

    HINSTANCE hEdge = ShellExecuteA(NULL, "open", "msedge.exe", launchArgs, dirPath, SW_SHOWNORMAL);

    // Fallback: Try Google Chrome in app mode
    if ((INT_PTR)hEdge <= 32) {
        hEdge = ShellExecuteA(NULL, "open", "chrome.exe", launchArgs, dirPath, SW_SHOWNORMAL);
    }

    // Fallback: Launch the HTML file directly via system default browser
    if ((INT_PTR)hEdge <= 32) {
        HINSTANCE hDefault = ShellExecuteA(NULL, "open", targetHtml, NULL, dirPath, SW_SHOWNORMAL);
        if ((INT_PTR)hDefault <= 32) {
            MessageBoxA(NULL,
                "Could not automatically launch the web browser.\n\nPlease open 'Resources\\TeleNest.html' directly in your browser.",
                "TeleNest Portable Launcher",
                MB_ICONINFORMATION | MB_OK);
            return 1;
        }
    }

    return 0;
}


#include <windows.h>
#include <shellapi.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define IDI_APPICON 1

// Convert a standard Windows path "C:\a\b\c.html" into a file URL "file:///C:/a/b/c.html"
static void ConvertPathToFileUrl(const char *inPath, char *outUrl, size_t maxLen) {
    size_t inLen = strlen(inPath);
    size_t outIdx = 0;
    
    // Prefix
    const char *prefix = "file:///";
    size_t prefixLen = strlen(prefix);
    if (outIdx + prefixLen < maxLen) {
        strcpy(outUrl, prefix);
        outIdx += prefixLen;
    }
    
    for (size_t i = 0; i < inLen && outIdx + 1 < maxLen; i++) {
        if (inPath[i] == '\\') {
            outUrl[outIdx++] = '/';
        } else {
            outUrl[outIdx++] = inPath[i];
        }
    }
    outUrl[outIdx] = '\0';
}

static BOOL FileExists(const char *path) {
    DWORD dwAttrib = GetFileAttributesA(path);
    return (dwAttrib != INVALID_FILE_ATTRIBUTES && !(dwAttrib & FILE_ATTRIBUTE_DIRECTORY));
}

static BOOL TryLaunchBrowser(const char *browserExe, const char *fileUrl, const char *workDir) {
    if (!FileExists(browserExe)) {
        return FALSE;
    }

    char cmdLine[MAX_PATH * 3];
    // Launch in Chrome/Edge --app mode for frameless, standalone desktop window
    snprintf(cmdLine, sizeof(cmdLine), "\"%s\" --app=\"%s\" --window-size=1440,900 --disable-features=Translate", browserExe, fileUrl);

    STARTUPINFOA si;
    PROCESS_INFORMATION pi;
    ZeroMemory(&si, sizeof(si));
    si.cb = sizeof(si);
    si.dwFlags = STARTF_USESHOWWINDOW;
    si.wShowWindow = SW_SHOW;
    ZeroMemory(&pi, sizeof(pi));

    BOOL success = CreateProcessA(
        NULL,
        cmdLine,
        NULL,
        NULL,
        FALSE,
        0,
        NULL,
        workDir,
        &si,
        &pi
    );

    if (success) {
        CloseHandle(pi.hProcess);
        CloseHandle(pi.hThread);
        return TRUE;
    }
    return FALSE;
}

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
    char exePath[MAX_PATH];
    char dirPath[MAX_PATH];
    char targetHtml[MAX_PATH];
    char fileUrl[MAX_PATH * 2];

    // Determine executable folder
    GetModuleFileNameA(NULL, exePath, MAX_PATH);
    char *lastBackslash = strrchr(exePath, '\\');
    if (lastBackslash) {
        *lastBackslash = '\0';
        strncpy(dirPath, exePath, MAX_PATH);
    } else {
        strcpy(dirPath, ".");
    }

    // Locate the standalone offline HTML file
    snprintf(targetHtml, MAX_PATH, "%s\\TeleNest-Offline-SingleFile.html", dirPath);
    if (!FileExists(targetHtml)) {
        snprintf(targetHtml, MAX_PATH, "%s\\TeleNest.html", dirPath);
    }
    if (!FileExists(targetHtml)) {
        snprintf(targetHtml, MAX_PATH, "%s\\app.html", dirPath);
    }
    if (!FileExists(targetHtml)) {
        snprintf(targetHtml, MAX_PATH, "%s\\app\\index.html", dirPath);
    }

    if (!FileExists(targetHtml)) {
        MessageBoxA(NULL,
            "Could not locate 'TeleNest-Offline-SingleFile.html' in this directory.\nPlease ensure the package files are extracted.",
            "TeleNest Portable - File Not Found",
            MB_ICONERROR | MB_OK);
        return 1;
    }

    ConvertPathToFileUrl(targetHtml, fileUrl, sizeof(fileUrl));

    const char *progFilesX86 = getenv("ProgramFiles(x86)");
    const char *progFiles = getenv("ProgramFiles");
    const char *localApp = getenv("LOCALAPPDATA");

    char browserPath[MAX_PATH];
    BOOL launched = FALSE;

    // 1. Microsoft Edge (Native on Windows 10 & 11)
    if (!launched && progFilesX86) {
        snprintf(browserPath, MAX_PATH, "%s\\Microsoft\\Edge\\Application\\msedge.exe", progFilesX86);
        launched = TryLaunchBrowser(browserPath, fileUrl, dirPath);
    }
    if (!launched && progFiles) {
        snprintf(browserPath, MAX_PATH, "%s\\Microsoft\\Edge\\Application\\msedge.exe", progFiles);
        launched = TryLaunchBrowser(browserPath, fileUrl, dirPath);
    }
    if (!launched && localApp) {
        snprintf(browserPath, MAX_PATH, "%s\\Microsoft\\Edge\\Application\\msedge.exe", localApp);
        launched = TryLaunchBrowser(browserPath, fileUrl, dirPath);
    }

    // 2. Google Chrome
    if (!launched && progFiles) {
        snprintf(browserPath, MAX_PATH, "%s\\Google\\Chrome\\Application\\chrome.exe", progFiles);
        launched = TryLaunchBrowser(browserPath, fileUrl, dirPath);
    }
    if (!launched && progFilesX86) {
        snprintf(browserPath, MAX_PATH, "%s\\Google\\Chrome\\Application\\chrome.exe", progFilesX86);
        launched = TryLaunchBrowser(browserPath, fileUrl, dirPath);
    }
    if (!launched && localApp) {
        snprintf(browserPath, MAX_PATH, "%s\\Google\\Chrome\\Application\\chrome.exe", localApp);
        launched = TryLaunchBrowser(browserPath, fileUrl, dirPath);
    }

    // 3. Brave Browser
    if (!launched && progFiles) {
        snprintf(browserPath, MAX_PATH, "%s\\BraveSoftware\\Brave-Browser\\Application\\brave.exe", progFiles);
        launched = TryLaunchBrowser(browserPath, fileUrl, dirPath);
    }
    if (!launched && localApp) {
        snprintf(browserPath, MAX_PATH, "%s\\BraveSoftware\\Brave-Browser\\Application\\brave.exe", localApp);
        launched = TryLaunchBrowser(browserPath, fileUrl, dirPath);
    }

    // 4. Default System Web Browser Fallback (ShellExecute)
    if (!launched) {
        HINSTANCE hRes = ShellExecuteA(NULL, "open", targetHtml, NULL, dirPath, SW_SHOWNORMAL);
        if ((INT_PTR)hRes > 32) {
            launched = TRUE;
        }
    }

    if (!launched) {
        MessageBoxA(NULL,
            "Could not automatically open a web browser.\nYou can open 'TeleNest-Offline-SingleFile.html' manually in your favorite browser.",
            "TeleNest Portable",
            MB_ICONWARNING | MB_OK);
        return 1;
    }

    return 0;
}

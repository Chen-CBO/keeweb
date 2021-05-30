import * as kdbxweb from 'kdbxweb';
import { Model } from 'util/model';
import { StorageFileOptions } from 'storage/types';
import { FileChalRespConfig, FileInfo } from 'models/file-info';
import { FileManager } from 'models/file-manager';

export class OpenState extends Model {
    id?: string;
    name?: string;
    password?: kdbxweb.ProtectedValue;
    storage?: string;
    path?: string;
    fileData?: ArrayBuffer;
    keyFileName?: string;
    keyFileData?: ArrayBuffer;
    keyFileHash?: string;
    keyFilePath?: string;
    rev?: string;
    opts?: StorageFileOptions;
    chalResp?: FileChalRespConfig;

    busy = false;
    openingFile = false;
    openError = false;
    invalidKey = false;
    secondRowVisible = false;
    autoFocusPassword = true;
    capsLockPressed = false;
    visualFocus = false;
    dragInProgress = false;

    constructor() {
        super();

        const fileInfo = FileManager.getFirstFileInfoToOpen();
        if (fileInfo) {
            this.selectFileInfo(fileInfo);
        }
    }

    selectFileInfo(fileInfo: FileInfo): void {
        if (this.busy) {
            return;
        }
        this.batchSet(() => {
            this.reset();
            this.id = fileInfo.id;
            this.name = fileInfo.name;
            this.storage = fileInfo.storage;
            this.path = fileInfo.path;
            this.keyFileName = fileInfo.keyFileName;
            this.keyFileHash = fileInfo.keyFileHash;
            this.keyFilePath = fileInfo.keyFilePath;
            this.rev = fileInfo.rev;
            this.opts = fileInfo.opts;
            this.chalResp = fileInfo.chalResp;
        });
    }

    setFile(name: string, data: ArrayBuffer, path?: string, storage?: string): void {
        if (this.busy) {
            return;
        }
        this.batchSet(() => {
            this.reset();

            this.name = name;
            this.fileData = data;
            this.path = path;
            this.storage = storage;
        });
    }

    setKeyFile(name: string, data: ArrayBuffer, path?: string): void {
        if (this.busy) {
            return;
        }
        this.batchSet(() => {
            this.resetKeyFile();

            this.keyFileName = name;
            this.keyFilePath = path;
            this.keyFileData = data;
        });
    }

    clearKeyFile(): void {
        if (this.busy) {
            return;
        }
        this.resetKeyFile();
    }

    selectNextFile(): void {
        if (this.busy) {
            return;
        }
        if (!this.id) {
            const [first] = FileManager.getFileInfosToOpen();
            if (first) {
                this.selectFileInfo(first);
            }
            return;
        }
        let found = false;
        for (const fileInfo of FileManager.getFileInfosToOpen()) {
            if (found) {
                this.selectFileInfo(fileInfo);
                return;
            }
            if (fileInfo.id === this.id) {
                found = true;
            }
        }
    }

    selectPreviousFile(): void {
        if (this.busy) {
            return;
        }
        if (!this.id) {
            const fileInfos = FileManager.getFileInfosToOpen();
            if (fileInfos.length) {
                this.selectFileInfo(fileInfos[fileInfos.length - 1]);
            }
            return;
        }
        let prevFileInfo: FileInfo | undefined;
        for (const fileInfo of FileManager.getFileInfosToOpen()) {
            if (fileInfo.id === this.id) {
                if (prevFileInfo) {
                    this.selectFileInfo(prevFileInfo);
                }
                return;
            }
            prevFileInfo = fileInfo;
        }
    }

    reset(): void {
        if (this.busy) {
            return;
        }
        this.batchSet(() => {
            this.id = undefined;
            this.name = undefined;
            this.password = kdbxweb.ProtectedValue.fromString('');
            this.storage = undefined;
            this.path = undefined;
            this.fileData = undefined;
            this.keyFileName = undefined;
            this.keyFileData = undefined;
            this.keyFileHash = undefined;
            this.keyFilePath = undefined;
            this.rev = undefined;
            this.opts = undefined;
            this.chalResp = undefined;

            this.openError = false;
            this.invalidKey = false;
        });
    }

    resetKeyFile(): void {
        this.batchSet(() => {
            this.keyFileName = undefined;
            this.keyFileData = undefined;
            this.keyFileHash = undefined;
            this.keyFilePath = undefined;
        });
    }

    beginOpen(): void {
        this.batchSet(() => {
            this.busy = true;
            this.openingFile = true;
            this.openError = false;
            this.invalidKey = false;
        });
    }

    setOpenError(invalidKey: boolean): void {
        this.batchSet(() => {
            this.busy = false;
            this.openingFile = false;
            this.openError = true;
            this.invalidKey = invalidKey;
        });
    }
}

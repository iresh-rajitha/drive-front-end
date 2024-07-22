import React, { useState, useEffect } from 'react';
import axios from 'axios';

type FileItem = {
    name: string;
    type: "file" | "folder";
};

const getHostURL = () => {
    if (window.location.host === "localhost:5173") {
        return "http://192.168.8.132:8000";
    } else {
        return "";
    }
};

console.log(getHostURL()); // This will log the host URL or IP to the console

const App: React.FC = () => {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [currentFolder, setCurrentFolder] = useState<string>("");
    const [progress, setProgress] = useState<number>(0);
    const BASE_URL = getHostURL();

    useEffect(() => {
        fetchFiles(currentFolder);
    }, [currentFolder]);

    const fetchFiles = async (folder: string) => {
        try {
            const response = await axios.get<FileItem[]>(`${BASE_URL}/files`, {
                params: { folder }
            });
            setFiles(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', currentFolder);

            try {
                const response = await axios.post(`${BASE_URL}/upload`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setProgress(percentCompleted);
                    }
                });
                console.log(response.data);
                setProgress(0); // Reset progress after upload
                fetchFiles(currentFolder);
            } catch (error) {
                console.error(error);
                setProgress(0); // Reset progress in case of error
            }
        }
    };

    const handleFileClick = (file: FileItem) => {
        if (file.type === "folder") {
            setCurrentFolder((prev) => (prev ? `${prev}/${file.name}` : file.name));
        } else {
            window.open(`${BASE_URL}/download?folder=${currentFolder}&filename=${file.name}`, '_blank');
        }
    };

    const handleBackClick = () => {
        const folderParts = currentFolder.split('/');
        folderParts.pop();
        setCurrentFolder(folderParts.join('/'));
    };

    return (
        <div className="App">
            <h1>Local Network Drive</h1>
            <input type="file" onChange={handleUpload} />
            <br/>
            {progress > 0 && (
                <>
                <progress value={progress} max="100">{progress}%</progress><span>{progress}%</span>
                </>
            )}
            <br/>
            <hr />
            {currentFolder && <button onClick={handleBackClick}>Back</button>}
            <ul>
                {files && files.map((file) => (
                    <li key={file.name} onDoubleClick={() => handleFileClick(file)}>
                        {file.type === "folder" ? "📁" : "📄"} {file.name}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default App;

function importFiles(filePath) {
    if (!filePath) return "No file path provided";

    var project = app.project;
    if (!project) return "No active project";

    var importFiles = [];
    importFiles[0] = filePath;

    var suppressUI = true;
    var bins = project.rootItem.children;
    var targetBin = project.rootItem; // Default to root

    // Import into active bin if possible? 
    // Usually importFiles imports to the Project panel root or active bin.

    var imported = project.importFiles(importFiles, suppressUI, targetBin, false);

    return imported ? "Import successful: " + filePath : "Import failed";
}

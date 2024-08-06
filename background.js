// Define findOrCreateCveFolder as an async function
async function findOrCreateFolder(folderName) {
  console.debug("looking for folder: ", folderName);
  let folderId;
  const folders = await chrome.bookmarks.search({ title: folderName });
  if (folders.length > 0) {
    console.debug(folderName, " folder already exists");
    folderId = folders[0].id;
  } else {
    console.debug(folderName, " folder does not exist, creating...");
    const newFolder = await chrome.bookmarks.create({ title: folderName });
    folderId = newFolder.id;
  }
  return folderId;
}

function addBookmark(folderId, bookmarkTitle, bookmarkUrl) {
  if (bookmarkTitle && bookmarkUrl && folderId) {
    chrome.bookmarks.create({
      parentId: folderId,
      title: bookmarkTitle,
      url: bookmarkUrl,
    });
    console.debug("Bookmark added: " + bookmarkTitle + " - " + bookmarkUrl);
  }
}

// function that retives a file from github
async function getGithubFile(url) {
  const response = await fetch(url);
  const data = await response.text();
  return data;
}

(async () => {
  const exampleFolderid = await findOrCreateFolder();
  console.log("exampleFolderid: ", exampleFolderid);
})();

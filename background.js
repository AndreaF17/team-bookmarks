const MAIN_FOLDER_NAME = "Shared-Bookmarks";
const JSON_URL = "";

async function findBookmarkFolderByName(folderName) {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.search({ title: folderName }, function (results) {
      if (chrome.runtime.lastError) {
        console.error("Error searching bookmarks: ", chrome.runtime.lastError);
        reject(chrome.runtime.lastError);
        return;
      }
      let folderId = [];
      // Iterate through search results
      for (let i = 0; i < results.length; i++) {
        // Check if the result is a folder (it doesn't have a 'url' property)
        if (results[i].url === undefined) {
          console.log("Folder found: " + results[i].title);
          folderId.push(results[i].id);
        }
      }
      resolve(folderId);
    });
  });
}

const removeOldData = async () => {
  console.log("Removing old data");
  try {
    const list_oldFolders = await findBookmarkFolderByName(MAIN_FOLDER_NAME);

    if (list_oldFolders.length > 0) {
      for (const folderId of list_oldFolders) {
        chrome.bookmarks.removeTree(folderId, () => {
          if (chrome.runtime.lastError) {
            console.error("Error removing folder: ", chrome.runtime.lastError);
          }
        });
      }
    }
    console.log("Storage cleared");
  } catch (error) {
    console.error("Error in removeOldData: ", error);
  }
};

// Define findOrCreateFolder as an async function
async function createFolder(folderName) {
  if (!MAIN_DIR_ID) {
    console.error("Main directory not found");
    return;
  }

  console.debug("looking for folder: ", folderName);
  let folderId;
  try {
    const folders = await new Promise((resolve, reject) => {
      chrome.bookmarks.search({ title: folderName, parent }, (results) => {
        if (chrome.runtime.lastError) {
          console.error(
            "Error searching for folder: ",
            chrome.runtime.lastError
          );
          reject(chrome.runtime.lastError);
          return;
        }
        resolve(results);
      });
    });

    if (folders.length > 0) {
      console.debug(folderName, " folder already exists");
      folderId = folders[0].id;
    } else {
      console.debug(folderName, " folder does not exist, creating...");
      const newFolder = await new Promise((resolve, reject) => {
        chrome.bookmarks.create({ title: folderName }, (folder) => {
          if (chrome.runtime.lastError) {
            console.error("Error creating folder: ", chrome.runtime.lastError);
            reject(chrome.runtime.lastError);
            return;
          }
          resolve(folder);
        });
      });
      folderId = newFolder.id;
    }
  } catch (error) {
    console.error("Error in createFolder: ", error);
  }
}

// function that creates a folder unter the mainDir
async function createFolder(folderName, parentId) {
  console.debug("creating folder: ", folderName);
  const folder = await chrome.bookmarks.create({
    parentId: parentId,
    title: folderName,
  });
  return folder.id;
}

// function that adds a bookmark to a folder
async function addBookmark(folderId, bookmarkTitle, bookmarkUrl) {
  // print parameters

  console.debug(
    "Adding bookmark: ",
    bookmarkTitle,
    " - ",
    bookmarkUrl,
    " to folder: ",
    folderId
  );
  if (bookmarkTitle && bookmarkUrl && folderId) {
    const folder = await chrome.bookmarks.get(folderId);
    if (folder && folder.length > 0) {
      chrome.bookmarks.create(
        {
          parentId: folder[0].id,
          title: bookmarkTitle,
          url: bookmarkUrl,
        },
        () => {
          console.debug(
            "Bookmark added: " + bookmarkTitle + " - " + bookmarkUrl
          );
        }
      );
    } else {
      console.error("Folder not found");
    }
  } else {
    console.error("Invalid parameters");
  }
}

// Remove a bookmark by its id
function removeBookmark(bookmarkId) {
  if (!bookmarkId) {
    console.error("Bookmark id not provided");
    return;
  }
  chrome.bookmarks.remove(bookmarkId, () => {
    console.debug("Bookmark removed: " + bookmarkId);
  });
}

// remove a folder by its id
function removeFolder(folderId) {
  if (!folderId) {
    console.error("Folder id not provided");
    return;
  }
  chrome.bookmarks.removeTree(folderId, () => {
    console.debug("Folder removed: " + folderId);
  });
}

function isEqual(obj1, obj2) {
  // Check if both values are strictly equal
  if (obj1 === obj2) return true;

  // If either of the values is null or not an object, they are not equal
  if (
    obj1 === null ||
    typeof obj1 !== "object" ||
    obj2 === null ||
    typeof obj2 !== "object"
  )
    return false;

  // Get the keys of both objects
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  // If the number of keys is different, the objects are not equal
  if (keys1.length !== keys2.length) return false;

  // Check if all keys and their values are equal
  for (let key of keys1) {
    if (!keys2.includes(key) || !isEqual(obj1[key], obj2[key])) {
      return false;
    }
  }

  return true;
}

// search for a folder by its title and return the folder id
async function findFolder(folderName, parentId) {
  const children = await chrome.bookmarks.getChildren(parentId);
  const folder = children.find((child) => child.title === folderName);
  return folder ? folder.id : false;
}

// searach for a bookmark by its title, url and return the bookmark id
async function findBookmark(bookmarkTitle, bookmarkUrl) {
  const bookmarks = await chrome.bookmarks.search({ title: bookmarkTitle });
  const bookmark = bookmarks.find((b) => b.url === bookmarkUrl);
  return bookmark ? bookmark.id : false;
}

// function that gets file from github and returns the json
async function getBookmarks() {
  try {
    const response = await fetch(new URL(JSON_URL), { cache: "no-store" });
    if (!response.ok) {
      console.log("Unable to fetch files");
      return;
    }
    const json = await response.json();
    return json;
  } catch (error) {
    console.log("Unable to fetch files");
  }
}

(async () => {
  // get storage data
  const storage = await chrome.storage.local.get(["extention-data"]);
  if (!storage["extention-data"]) {
    console.log("Extention init");
    await removeOldData();

    // create main folder
    const mainFolderId = await createFolder(MAIN_FOLDER_NAME);

    // fetching first file
    const bookmarks = await getBookmarks();

    // save main folder id to storage and pulled json object
    await chrome.storage.local.set({
      "extention-data": {
        "main-folder-id": mainFolderId,
        "bookmarks-file": bookmarks,
      },
    });

    console.log(bookmarks);

    for (const folder in bookmarks) {
      const folderId = await createFolder(folder, mainFolderId);
      console.log("Subfolder ID: ", folderId);

      for (const id in bookmarks[folder]) {
        const bookmark = bookmarks[folder][id];
        console.log("Adding bookmark: ", bookmark);
        await addBookmark(folderId, bookmark.title, bookmark.url);
      }
    }
    console.log("Extention init done");
  } else {
    console.log("Extention already initialized");
  }

  // print storage data

  setInterval(async () => {
    const data = await chrome.storage.local.get(["extention-data"]);
    const mainFolderId = data["extention-data"]["main-folder-id"];
    const saved_file = data["extention-data"]["bookmarks-file"];

    // check for changes from the github file and the saved file
    const new_file = await getBookmarks();

    if (!isEqual(saved_file, new_file)) {
      console.log("saved file: ", saved_file);
      console.log("new file: ", new_file);

      console.log("File changed");
      // remove all bookmarks
      const children = await chrome.bookmarks.getChildren(mainFolderId);
      for (const child of children) {
        if (child.url) {
          removeBookmark(child.id);
        } else {
          removeFolder(child.id);
        }
      }

      // add new bookmarks
      for (const folder in new_file) {
        const folderId = await createFolder(folder, mainFolderId);
        console.log("Subfolder ID: ", folderId);

        for (const id in new_file[folder]) {
          const bookmark = new_file[folder][id];
          console.log("Adding bookmark: ", bookmark);
          await addBookmark(folderId, bookmark.title, bookmark.url);
        }
      }

      // save new file
      await chrome.storage.local.set({
        "extention-data": {
          "main-folder-id": mainFolderId,
          "bookmarks-file": new_file,
        },
      });
    } else {
      console.log("File not changed");
    }
  }, 60000);
})();

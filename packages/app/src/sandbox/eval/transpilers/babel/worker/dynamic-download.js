import resolve from 'browser-resolve';
import getRequireStatements from './simple-get-require-statements';

const path = self.BrowserFS.BFSRequire('path');

function mkDirByPathSync(targetDir, { isRelativeToScript = false } = {}) {
  const fs = self.BrowserFS.BFSRequire('fs');

  const sep = path.sep;
  const initDir = path.isAbsolute(targetDir) ? sep : '';
  const baseDir = isRelativeToScript ? __dirname : '.';

  return targetDir.split(sep).reduce((parentDir, childDir) => {
    const curDir = path.resolve(baseDir, parentDir, childDir);
    try {
      fs.mkdirSync(curDir);
    } catch (err) {
      if (err.code === 'EEXIST') {
        // curDir already exists!
        return curDir;
      }

      // To avoid `EISDIR` error on Mac and `EACCES`-->`ENOENT` and `EPERM` on Windows.
      if (err.code === 'ENOENT') {
        // Throw the original parentDir error on curDir `ENOENT` failure.
        throw new Error(`EACCES: permission denied, mkdir '${parentDir}'`);
      }

      const caughtErr = ['EACCES', 'EPERM', 'EISDIR'].indexOf(err.code) > -1;
      if (!caughtErr || (caughtErr && curDir === path.resolve(targetDir))) {
        throw err; // Throw if it's just the last created dir.
      }
    }

    return curDir;
  }, initDir);
}

export const resolveAsyncModule = (
  modulePath: string,
  { ignoredExtensions }?: { ignoredExtensions?: Array<string> }
) =>
  new Promise((r, reject) => {
    const sendId = Math.floor(Math.random() * 10000);
    self.postMessage({
      type: 'resolve-async-transpiled-module',
      path: modulePath,
      id: sendId,
      options: { isAbsolute: true, ignoredExtensions },
    });

    const resolveFunc = message => {
      const { type, id, found } = message.data;

      if (
        type === 'resolve-async-transpiled-module-response' &&
        id === sendId
      ) {
        if (found) {
          r(message.data);
        } else {
          reject(new Error("Could not find path: '" + modulePath + "'."));
        }
        self.removeEventListener('message', resolveFunc);
      }
    };

    self.addEventListener('message', resolveFunc);
  });

const downloads = {};
export async function downloadPath(absolutePath) {
  const r = await resolveAsyncModule(absolutePath, {});

  if (!r.found) {
    throw new Error(`${absolutePath} not found.`);
  }

  self.postMessage({
    type: 'add-transpilation-dependency',
    path: r.path,
  });

  const fs = self.BrowserFS.BFSRequire('fs');

  let existingFile;

  try {
    existingFile = fs.readFileSync(r.path);
  } catch (e) {
    /* ignore */
  }

  if (existingFile) {
    try {
      // Maybe there was a redirect from package.json. Manager only returns the redirect,
      // if the babel worker doesn't have the package.json it enters an infinite loop.
      const r2 = await resolveAsyncModule(
        path.join(absolutePath, 'package.json'),
        {}
      );
      if (r2) {
        mkDirByPathSync(path.dirname(r2.path));

        fs.writeFileSync(r2.path, r2.code);
      }
    } catch (e) {
      /* ignore */
    }

    return Promise.resolve({
      code: existingFile,
      path: r.path,
    });
  }

  mkDirByPathSync(path.dirname(r.path));

  fs.writeFileSync(r.path, r.code);

  const requires = getRequireStatements(r.code);

  await Promise.all(
    requires.map(foundR => {
      if (foundR.type === 'direct') {
        if (foundR.path === 'babel-plugin-macros') {
          return '';
        }

        if (downloads[foundR.path]) {
          return downloads[foundR.path];
        }

        try {
          resolve.sync(foundR.path, {
            filename: r.path,
            extensions: ['.js', '.json'],
            moduleDirectory: ['node_modules'],
          });
          return '';
        } catch (e) {
          // eslint-disable-next-line no-use-before-define
          downloads[foundR.path] = downloadFromError(e)
            .then(() => {
              delete downloads[foundR.path];
            })
            .catch(() => {
              delete downloads[foundR.path];
            });
          return downloads[foundR.path];
        }
      }
      return Promise.resolve();
    })
  );

  return r;
}

export async function downloadFromError(e) {
  if (e.message.indexOf('Cannot find module') > -1) {
    return new Promise(res => {
      const dep = e.message.match(/Cannot find module '(.*?)'/)[1];
      const from = e.message.match(/from '(.*?)'/)[1];
      const absolutePath = dep.startsWith('.') ? path.join(from, dep) : dep;

      res(downloadPath(absolutePath));
    });
  }

  return Promise.resolve();
}

# Releasing

1.  Set the correct version in `package.json` and increase the extension
    version in `metadata.json`.
    
    Run `npm install`.

2.  Update `CHANGELOG.md` with version and release date. Make sure all
    issues / PRs are listed. Update the link for "full changelog".

3.  Commit `metadata.json`, `package.json` and `package-lock.json` and
    `CHANGELOG.md` ("Prepare release 1.7.1").

4.  Rename current "next" milestone, create a new "next" one: <https://github.com/EasyScreenCast/EasyScreenCast/milestones>

5.  Create a tag and push: e.g. `git tag 1.4.0 && git push origin tag 1.4.0`

6.  Build locally `make zip-file`

7.  Create a new draft release on github: <https://github.com/EasyScreenCast/EasyScreenCast/releases/new>.
    Use the info from `CHANGELOG.md` to for the release notes. Upload the zipfile as a release artifact.

8.  Upload zip file on <https://extensions.gnome.org>.

9.  Once the extension is activated on <https://extensions.gnome.org/extension/690/easyscreencast/>
    publish the release on github: <https://github.com/EasyScreenCast/EasyScreenCast/releases>.

    If the extension is rejected, you can move the tag and start over.

10. Update and commit `CHANGELOG.md` - add new version:

    ```
    # next

    **🚀 Implemented enhancements:**

    **🎉 Merged pull requests:**

    **🐛 Fixed bugs:**

    **📦 Dependency updates:**

    **Full Changelog**: <https://github.com/EasyScreenCast/EasyScreenCast/compare/1.7.1...HEAD>
    ```

11. Push master branch.

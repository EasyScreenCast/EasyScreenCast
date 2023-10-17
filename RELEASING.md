# Releasing

1.  increase the extension version in `metadata.json`.
    and run `npm --no-git-tag-version version 1.8.0`.
    Run `npm install`.

2.  Update `CHANGELOG.md` with version and release date. Make sure all
    issues / PRs are listed. Update the link for "full changelog".

3.  Commit `metadata.json`, `package.json` and `package-lock.json` and
    `CHANGELOG.md` ("Prepare release 1.8.0").

4.  Rename current "next" milestone to "1.8.0", create a new "next" one: <https://github.com/EasyScreenCast/EasyScreenCast/milestones>

5.  Create a tag and push: e.g. `git tag 1.8.0 && git push origin tag 1.8.0`

6.  Build locally `make zip-file`

7.  Create a new draft release on github: <https://github.com/EasyScreenCast/EasyScreenCast/releases/new>.
    Use the info from `CHANGELOG.md` to for the release notes. Upload the zipfile as a release artifact.

8.  Upload zip file on <https://extensions.gnome.org>.
    The new version will be reviewed, which can take a while, but is usually very quick. You
    can have a look at <https://extensions.gnome.org/review/> to see, how many reviews are currently in the
    queue.

9.  Once the extension is activated on <https://extensions.gnome.org/extension/690/easyscreencast/>
    publish the release on github: <https://github.com/EasyScreenCast/EasyScreenCast/releases>.

    If the extension is rejected, you can move the tag and start over.

10. Run `npm --no-git-tag-version version 1.8.1-snapshot`.
    Update `CHANGELOG.md` - add new version:

    ```
    # next

    **🚀 Implemented enhancements:**

    **🎉 Merged pull requests:**

    **🐛 Fixed bugs:**

    **📦 Dependency updates:**

    **Full Changelog**: <https://github.com/EasyScreenCast/EasyScreenCast/compare/1.8.0...HEAD>
    ```

    Commit `package.json` and `package-lock.json` and
    `CHANGELOG.md` ("Prepare next development version").

11. Push master branch.

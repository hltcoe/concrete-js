#!/bin/bash
# Updates version, builds, publishes package to npm,
# updates version to pre-release, and pushes to git.
# See README.md or comments below for more information.

# Unset variables cause errors
set -u

# Exit on error
set -e

NPM_VERSION_CMD="npm version --no-git-tag-version"
npm_version_type=""

print_usage() {
    echo "The version level must be specified: patch, minor, or major."
    echo "Run \`npm version --help\` for details."
}

while [ $# -gt 0 ]
do
    case "$1" in
        -h)
            print_usage
            exit 0
            ;;
        --help)
            print_usage
            exit 0
            ;;
        patch)
            npm_version_type="$1"
            ;;
        minor)
            npm_version_type="$1"
            ;;
        major)
            npm_version_type="$1"
            ;;
        *)
            print_usage >&2
            exit 1
            ;;
    esac
    shift
done

if [[ -z "$npm_version_type" ]]
then
    print_usage >&2
    exit 1
fi

# Echo each command as it runs
set -x

# 0. Clean repository (you will lose any uncommitted changes!)
git reset --hard
git clean -fdx
npm ci

# 1. Update version
VERSION=$($NPM_VERSION_CMD "$npm_version_type")

# 2. Build
npx grunt

# 3. Add changes & commit
git add docs
git commit -am "$VERSION"

# 4. Tag
git tag -am "$VERSION" "$VERSION"

# 5. Push to NPM
pushd dist_nodejs
npm publish
popd

# 6. Update version to pre-release
PRE_VERSION=$($NPM_VERSION_CMD --preid=dev prepatch)

# 7. Add changes & commit
git commit -am "$PRE_VERSION"

# 8. Push to github and gitlab
git push https://github.com/hltcoe/concrete-js.git main "$VERSION"
git push https://gitlab.hltcoe.jhu.edu/research/concrete-js.git main "$VERSION"

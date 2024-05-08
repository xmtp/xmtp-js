export function semverParse(version: string) {
  const [major, minor, ...patch] = version.split('.')

  return {
    major: Number(major),
    minor: Number(minor),
    // Keep patch as a string so that it can support prerelease versions
    patch: patch.join('.'),
  }
}

export function isSameMajorVersion(a?: string, b?: string): boolean {
  // If no version is provided, assume it is the same
  if (!a || !b) {
    return true
  }
  return semverParse(a).major === semverParse(b).major
}

// Checks if A semver is greater than B semver
export function semverGreaterThan(a?: string, b?: string): boolean {
  if (!a || !b) {
    return false
  }
  const aSemver = semverParse(a)
  const bSemver = semverParse(b)
  if (aSemver.major !== bSemver.major) {
    return aSemver.major > bSemver.major
  }
  if (aSemver.minor !== bSemver.minor) {
    return aSemver.minor > bSemver.minor
  }

  if (!aSemver.patch || !bSemver.patch) {
    return false
  }

  return patchGreaterThan(aSemver.patch, bSemver.patch)
}

// Home-brewed attempt at comparing patch versions so we don't have to import semver package.
// Example full version might be "2.0.1-alpha.1", and this will be operating on the "1-alpha.1" portion
function patchGreaterThan(a: string, b: string): boolean {
  const [aVersion, aExtra] = a.split('-')
  const [bVersion, bExtra] = b.split('-')

  if (Number(aVersion) !== Number(bVersion)) {
    return Number(aVersion) > Number(bVersion)
  }

  if (!aExtra || !bExtra) {
    return false
  }

  const [aTag, aTagVersion] = aExtra.split('.')
  const [bTag, bTagVersion] = bExtra.split('.')
  if (aTag !== bTag) {
    return true
  }

  return Number(aTagVersion) > Number(bTagVersion)
}

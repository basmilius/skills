//! The placeholders in a configuration string: `%name%` and `%env(PROCESSOR:NAME)%`, each with the
//! range it covers so an editor can complete and rename it.

use std::ops::Range;

use crate::keys::KeyKind;

/// A placeholder found in a string.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Placeholder {
    pub kind: KeyKind,
    pub name: String,

    /// The byte range of the name in the document, without the `%` delimiters.
    pub range: Range<usize>,
}

/// The placeholders in `value`, which starts at byte `start` of the document. A doubled `%%` is a
/// literal percent sign and an empty or spaced name is not a placeholder.
pub fn placeholders(value: &str, start: usize) -> Vec<Placeholder> {
    let mut found = Vec::new();
    let mut from = 0;

    while let Some(open) = value[from..].find('%') {
        let begin = from + open;

        if value[begin + 1..].starts_with('%') {
            from = begin + 2;

            continue;
        }

        let Some(length) = value[begin + 1..].find('%') else {
            break;
        };

        let inner_start = begin + 1;
        let inner = &value[inner_start..inner_start + length];
        from = inner_start + length + 1;

        if inner.is_empty() || inner.contains(' ') {
            continue;
        }

        let (kind, offset, name) = match inner.strip_prefix("env(").and_then(|rest| rest.strip_suffix(')')) {
            Some(env) => {
                let skipped = env.rfind(':').map_or(0, |colon| colon + 1);

                (KeyKind::Env, inner_start + 4 + skipped, &env[skipped..])
            }
            None => (KeyKind::Parameter, inner_start, inner),
        };

        found.push(Placeholder {
            kind,
            name: name.to_string(),
            range: start + offset..start + offset + name.len(),
        });
    }

    found
}

/// The placeholder whose name covers `offset`, inclusive at both ends so a cursor right after the
/// name still finds it.
pub fn placeholder_at(found: &[Placeholder], offset: usize) -> Option<&Placeholder> {
    found
        .iter()
        .find(|placeholder| placeholder.range.start <= offset && offset <= placeholder.range.end)
}

/// Whether a file is configuration that may hold placeholders.
pub fn is_config(path: &std::path::Path) -> bool {
    let yaml = path
        .extension()
        .and_then(|extension| extension.to_str())
        .is_some_and(|extension| matches!(extension, "yaml" | "yml"));

    yaml && path.components().any(|component| component.as_os_str() == "config")
}

mod lookup;
mod model;

use std::collections::HashMap;

use crate::ident::Ident;

/// An index into [`Catalog::tables`].
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub struct TableId(pub usize);

/// Where a table's definition came from.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Origin {
    Database,
    Migration,

    /// A `CREATE TABLE` in the open document, which wins over both others until it is saved.
    Document,
}

/// The tables a connection knows, by schema and name.
#[derive(Default)]
pub struct Catalog {
    tables: Vec<Table>,
    by_name: HashMap<(Option<Ident>, Ident), TableId>,

    /// The schema an unqualified name resolves in, or `None` when the dialect has no schemas.
    default_schema: Option<Ident>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Table {
    pub name: Ident,
    pub origin: Origin,
    pub columns: Vec<Ident>,
}

impl Catalog {
    pub const MAX_TABLES: usize = 10_000;

    pub fn new(default_schema: Option<Ident>) -> Self {
        Self {
            default_schema,
            ..Self::default()
        }
    }

    /// Adds a table, replacing an earlier one with the same name unless that came from the document.
    pub fn insert(&mut self, schema: Option<Ident>, table: Table) -> TableId {
        let key = (schema, table.name.clone());

        if let Some(&id) = self.by_name.get(&key) {
            if self.tables[id.0].origin != Origin::Document {
                self.tables[id.0] = table;
            }

            return id;
        }

        let id = TableId(self.tables.len());
        self.tables.push(table);
        self.by_name.insert(key, id);

        id
    }

    /// The table a name stands for, looked up in `schema` or else in the default schema.
    pub fn find_table(&self, schema: Option<&Ident>, name: &Ident) -> Option<TableId> {
        let schema = schema.or(self.default_schema.as_ref()).cloned();

        self.by_name.get(&(schema, name.clone())).copied()
    }

    pub fn table(&self, id: TableId) -> &Table {
        &self.tables[id.0]
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn table(name: &str, origin: Origin) -> Table {
        Table {
            name: Ident::new(name),
            origin,
            columns: Vec::new(),
        }
    }

    #[test]
    fn a_document_table_survives_a_database_refresh() {
        let mut catalog = Catalog::new(None);
        let id = catalog.insert(None, table("users", Origin::Document));

        catalog.insert(None, table("users", Origin::Database));

        assert_eq!(catalog.table(id).origin, Origin::Document);
        assert_eq!(catalog.find_table(None, &Ident::new("users")), Some(id));
    }
}

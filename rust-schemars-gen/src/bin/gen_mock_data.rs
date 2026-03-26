use std::fs;
use std::path::Path;

use fake::{Fake, Faker};
use rust_schemars_gen::*;
use schemars::JsonSchema;
use serde::Serialize;

fn write_mock_json<T>(dir: &Path, filename: &str, count: usize)
where
    T: Serialize + fake::Dummy<Faker> + JsonSchema,
{
    let data: Vec<T> = (0..count).map(|_| Faker.fake()).collect();
    let json_str = serde_json::to_string_pretty(&data).unwrap();
    let mut path = dir.join(filename);
    path.set_extension("json");
    fs::write(&path, &json_str).unwrap();

    // 顺便写入json_schema
    let json_schema_str = get_json_schema::<T>();
    let mut path = dir.join(filename);
    path.set_extension("schema.json");
    fs::write(&path, &json_schema_str).unwrap();
}

fn main() {
    let out_dir = Path::new(env!("CARGO_MANIFEST_DIR")).join("mock");
    fs::remove_dir_all(&out_dir).unwrap();
    fs::create_dir_all(&out_dir).unwrap();
    println!("Generating mock data into {}", out_dir.display());

    write_mock_json::<ComplexStruct>(&out_dir, "complex_struct", 100);
    write_mock_json::<ComplexStruct2>(&out_dir, "complex_struct_2", 100);

    println!("Done!");
}

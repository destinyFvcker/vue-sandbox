use std::fs;
use std::path::Path;

use fake::{Fake, Faker};
use rust_schemars_gen::*;
use serde::Serialize;

fn write_mock_json<T>(dir: &Path, filename: &str, count: usize)
where
    T: Serialize + fake::Dummy<Faker>,
{
    let data: Vec<T> = (0..count).map(|_| Faker.fake()).collect();
    let json_str = serde_json::to_string_pretty(&data).unwrap();
    let path = dir.join(filename);
    fs::write(&path, &json_str).unwrap();
    println!("  -> {}", path.display());
}

fn main() {
    let out_dir = Path::new(env!("CARGO_MANIFEST_DIR")).join("src/mock");
    fs::create_dir_all(&out_dir).unwrap();
    println!("Generating mock data into {}", out_dir.display());

    write_mock_json::<MyStruct>(&out_dir, "my_struct.json", 10);
    write_mock_json::<FooStruct>(&out_dir, "foo_struct.json", 10);
    write_mock_json::<BarStruct>(&out_dir, "bar_struct.json", 10);
    write_mock_json::<FooBarStruct>(&out_dir, "foo_bar_struct.json", 5);
    write_mock_json::<FooBazStruct>(&out_dir, "foo_baz_struct.json", 5);
    write_mock_json::<QuxNormalEnum>(&out_dir, "qux_normal_enum.json", 5);
    write_mock_json::<QuxTupleEnum>(&out_dir, "qux_tuple_enum.json", 5);
    write_mock_json::<QuxStructEnum>(&out_dir, "qux_struct_enum.json", 5);

    println!("Done!");
}

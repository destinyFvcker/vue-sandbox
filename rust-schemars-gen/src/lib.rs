#![allow(unused)]

use schemars::{JsonSchema, generate::SchemaSettings};
use serde::{Deserialize, Serialize};

pub fn print_json_schema<T>()
where
    T: JsonSchema,
{
    let generator = SchemaSettings::draft07().into_generator();
    let schema = generator.into_root_schema_for::<T>();
    println!("{}", serde_json::to_string_pretty(&schema).unwrap());
}

#[derive(Deserialize, Serialize, JsonSchema)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct MyStruct {
    #[serde(rename = "myNumber")]
    pub my_int: i32,
    pub my_bool: bool,
    #[serde(default)]
    #[schemars(extend("x-shadcn-variant" = "tabs"))]
    pub my_nullable_enum: Option<MyEnum>,
}

#[derive(Deserialize, Serialize, JsonSchema)]
#[serde(untagged)]
pub enum MyEnum {
    StringNewType(String),
    StructVariant { floats: Vec<f32> },
}

#[derive(Deserialize, Serialize, JsonSchema)]
pub struct FooStruct {
    pub foo_foo: i32,
    pub foo_bar: String,
    pub foo_qux: String,
}

#[derive(Deserialize, Serialize, JsonSchema)]
pub struct BarStruct {
    pub bar_foo: i32,
    pub bar_bar: String,
    pub bar_qux: String,
}

#[derive(Deserialize, Serialize, JsonSchema)]
pub struct FooBarStruct {
    pub foo: FooStruct,
    pub bar: Option<BarStruct>,
}

#[derive(Deserialize, Serialize, JsonSchema)]
pub enum QuxNormalEnum {
    Foo,
    Bar,
}

#[derive(Deserialize, Serialize, JsonSchema)]
pub enum QuxTupleEnum {
    Write(String),
    Move(i32, i32),
    ChangeColor(u8, u8, u8),
}

#[derive(Deserialize, Serialize, JsonSchema)]
pub enum QuxStructEnum {
    Quit,
    Move { x: i32, y: i32 },
    Write { text: String },
}

#[cfg(test)]
mod tests {
    use schemars::generate::SchemaSettings;

    use super::*;

    #[test]
    fn my_first_gen_schema() {
        print_json_schema::<MyStruct>();
    }

    #[test]
    fn basic_container_schema1() {
        #[derive(Deserialize, Serialize, JsonSchema)]
        #[serde(transparent)]
        pub struct FooVec(i32);

        print_json_schema::<FooVec>();
    }

    #[test]
    fn basic_nested_struct_schema() {
        print_json_schema::<FooBarStruct>();
    }

    #[test]
    fn basic_normal_enum_schema() {
        print_json_schema::<QuxNormalEnum>();
    }

    #[test]
    fn basic_tuple_enum_schema() {
        print_json_schema::<QuxTupleEnum>();
    }

    #[test]
    fn basic_struct_enum_schema() {
        print_json_schema::<QuxStructEnum>();
    }
}

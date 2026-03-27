#![allow(unused)]

use fake::Dummy;
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

pub fn get_json_schema<T>() -> String
where
    T: JsonSchema,
{
    let generator = SchemaSettings::draft07().into_generator();
    let schema = generator.into_root_schema_for::<T>();
    serde_json::to_string_pretty(&schema).unwrap()
}

/// ComplexStruct
#[derive(Deserialize, Serialize, JsonSchema, Dummy)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ComplexStruct {
    /// The primary numeric identifier for this record. Must be a valid 32-bit signed integer.
    #[serde(rename = "myNumber")]
    pub my_int: i32,
    /// Indicates whether this entry is currently active or has been disabled.
    pub my_bool: bool,
    /// An optional categorization tag. When omitted, defaults to null and no category is applied.
    #[serde(default)]
    #[schemars(extend("x-shadcn-variant" = "tabs"))]
    pub my_nullable_enum: Option<MyEnum>,
}

/// MyEnum
#[derive(Deserialize, Serialize, JsonSchema, Dummy)]
#[serde(untagged)]
pub enum MyEnum {
    /// A plain text label used for simple string-based classification.
    StringNewType(String),
    /// A variant carrying a list of floating-point measurements, e.g. sensor readings.
    StructVariant { bars: Vec<f32> },
    /// A variant carrying a list of integer counts, e.g. event frequencies.
    StructVariant2 { foos: Vec<i32> },
}

/// ComplexStruct2
#[derive(Deserialize, Serialize, JsonSchema, Dummy)]
pub struct ComplexStruct2 {
    /// A nested struct holding the primary foo/bar relationship for this record.
    pub nested_field: SimpleNestedStruct,
    /// Coarse-grained classification using the standard two-value enum.
    pub normal_enum: NormalEnum,
    /// Encodes a user action as a tuple-style enum variant with associated data.
    pub tuple_enum: TupleEnum,
    /// Describes a state-machine transition using a struct-style enum variant.
    pub struct_enum: StructEnum,
}

/// FooStruct
#[derive(Deserialize, Serialize, JsonSchema, Dummy)]
pub struct FooStruct {
    /// Unique numeric key that identifies this foo within its parent collection.
    pub foo_foo: i32,
    /// Human-readable name or secondary identifier for this foo entry.
    pub foo_bar: String,
    /// Auxiliary tag providing extra context, such as a region or category code.
    pub foo_qux: String,
}

/// BarStruct
#[derive(Deserialize, Serialize, JsonSchema, Dummy)]
pub struct BarStruct {
    /// Numeric rank or ordering index assigned to this bar record.
    pub bar_foo: i32,
    /// Descriptive label for this bar, typically a short slug or display name.
    pub bar_bar: String,
    /// Optional metadata string, often used to carry a status or source marker.
    pub bar_qux: String,
}

/// SimpleNestedStruct
#[derive(Deserialize, Serialize, JsonSchema, Dummy)]
pub struct SimpleNestedStruct {
    /// The required foo component; every nested struct must have exactly one foo.
    pub foo: FooStruct,
    /// An optional bar attachment; absent when no bar data has been associated yet.
    pub bar: Option<BarStruct>,
}

/// Normal Enum
#[derive(Deserialize, Serialize, JsonSchema, Dummy)]
pub enum NormalEnum {
    /// Represents the first state or category in this two-value classification.
    Foo,
    /// Represents the second state; mutually exclusive with `Foo`.
    Bar,
}

/// TupleEnum
#[derive(Deserialize, Serialize, JsonSchema, Dummy)]
pub enum TupleEnum {
    /// Carries a plain text message to be written to the output stream.
    Write(String),
    /// Moves the cursor or entity to the given (x, y) coordinate pair.
    Move(i32, i32),
    /// Sets the active color using red, green, and blue channel values (0–255 each).
    ChangeColor(i32, i32, i32),
}

/// struct Enum
#[derive(Deserialize, Serialize, JsonSchema, Dummy)]
pub enum StructEnum {
    /// Signals that the current operation should terminate immediately with no payload.
    Quit,
    /// Requests a positional update; `x` and `y` are the target coordinates.
    Move { x: i32, y: i32 },
    /// Appends the given `text` string to the current output buffer.
    Write { text: String },
}

#[cfg(test)]
mod tests {
    use schemars::generate::SchemaSettings;

    use super::*;

    #[test]
    fn complex_struct_gen_schema() {
        print_json_schema::<ComplexStruct>();
    }

    #[test]
    fn complex_struct2_gen_schema() {
        print_json_schema::<ComplexStruct2>();
    }

    #[test]
    fn basic_container_schema1() {
        #[derive(Deserialize, Serialize, JsonSchema)]
        #[serde(transparent)]
        pub struct FooVec(i32);

        print_json_schema::<FooVec>();
    }

    #[test]
    fn tuple_eunm_with_struct() {
        /// sss
        #[derive(Deserialize, Serialize, JsonSchema)]
        #[schemars(title = "FooFoo的struct!")]
        struct FooStruct {
            foo1: i32,
            foo2: i32,
            foo3: i32,
        }

        /// sssa
        #[derive(Deserialize, Serialize, JsonSchema)]
        #[schemars(title = "BarBar的struct!")]
        struct BarStruct {
            bar1: String,
            bar2: String,
            bar3: String,
        }

        /// sss + sssa
        #[derive(Deserialize, Serialize, JsonSchema)]
        #[schemars(title = "Foo + Bar的enum!")]
        enum FooBarEnum {
            Foo(FooStruct),
            Bar(BarStruct),
        }

        print_json_schema::<FooBarEnum>();
    }

    #[test]
    fn tuple_eunm_with_struct_tag() {
        /// sss
        #[derive(Deserialize, Serialize, JsonSchema)]
        #[schemars(title = "FooFoo的struct!")]
        struct FooStruct {
            foo1: i32,
            foo2: i32,
            foo3: i32,
        }

        /// sssa
        #[derive(Deserialize, Serialize, JsonSchema)]
        #[schemars(title = "BarBar的struct!")]
        struct BarStruct {
            bar1: String,
            bar2: String,
            bar3: String,
        }

        /// sss + sssa
        #[derive(Deserialize, Serialize, JsonSchema)]
        #[schemars(title = "Foo + Bar的enum!")]
        #[serde(tag = "type")]
        enum FooBarEnum {
            Foo(FooStruct),
            Bar(BarStruct),
        }

        print_json_schema::<FooBarEnum>();
    }

    #[test]
    fn tuple_eunm_with_struct_tag_and_content() {
        /// sss
        #[derive(Deserialize, Serialize, JsonSchema)]
        #[schemars(title = "FooFoo的struct!")]
        struct FooStruct {
            foo1: i32,
            foo2: i32,
            foo3: i32,
        }

        /// sssa
        #[derive(Deserialize, Serialize, JsonSchema)]
        #[schemars(title = "BarBar的struct!")]
        struct BarStruct {
            bar1: String,
            bar2: String,
            bar3: String,
        }

        /// sss + sssa
        #[derive(Deserialize, Serialize, JsonSchema)]
        #[schemars(title = "Foo + Bar的enum!")]
        #[serde(tag = "t", content = "c")]
        enum FooBarEnum {
            Foo(FooStruct),
            Bar(BarStruct),
        }

        print_json_schema::<FooBarEnum>();
    }
}

<script setup lang="ts">
import {
	coreReducer,
	Actions,
	Generate,
	configReducer,
	defaultMiddleware,
	type JsonSchema,
	type UISchemaElement,
	type ValidationMode,
	type JsonFormsCore,
	type JsonFormsUISchemaRegistryEntry,
	type JsonFormsRendererRegistryEntry,
	type JsonFormsCellRendererRegistryEntry,
	type CoreActions,
	type Middleware,
} from "@jsonforms/core";
import { DispatchRenderer, type MaybeReadonly } from "@jsonforms/vue";

const isObject = (elem: any): elem is Object => {
	return elem && typeof elem === "object";
};

interface Props {
	data?: any;
	schema?: JsonSchema;
	uischema?: UISchemaElement;
	renderers: MaybeReadonly<JsonFormsRendererRegistryEntry[]>;
	cells?: MaybeReadonly<JsonFormsCellRendererRegistryEntry[]>;
	config?: any;
	readonly?: boolean;
	uischemas?: MaybeReadonly<JsonFormsUISchemaRegistryEntry[]>;
	validationMode?: ValidationMode;
	middleware?: Middleware;
}

const props = withDefaults(defineProps<Props>(), {
	data: undefined,
	schema: undefined,
	uischema: undefined,
	cells: () => [],
	config: undefined,
	readonly: false,
	uischemas: () => [],
	validationMode: "ValidateAndShow",
	middleware: defaultMiddleware,
});

const dataToUse = ref(props.data);
const schemaToUse = ref<JsonSchema>(props.schema ?? Generate.jsonSchema(isObject(props.data) ? props.data : {}));
const uischemaToUse = ref<UISchemaElement>(
	// TODO 这里应该要去掉相关layout element，要不就是要对layout element进行改造
	props.uischema ?? Generate.uiSchema(schemaToUse.value, undefined, undefined, schemaToUse.value),
);

const initCore = (): JsonFormsCore => {
	const initialCore = {
		data: dataToUse.value,
		schema: schemaToUse.value,
		uischema: uischemaToUse.value,
	};
	return props.middleware(
		initialCore,
		Actions.init(dataToUse.value, schemaToUse.value, uischemaToUse.value, {
			validationMode: props.validationMode,
		}),
		coreReducer,
	);
};

const jsonforms = shallowReactive({
	core: initCore(),
	config: configReducer(undefined, Actions.setConfig(props.config)),
	renderers: props.renderers,
	cells: props.cells,
	uischemas: props.uischemas,
	readonly: props.readonly,
});

const dispatch = (action: CoreActions) => {
	jsonforms.core = props.middleware(jsonforms.core as JsonFormsCore, action, coreReducer);
};

provide("jsonforms", jsonforms);
provide("dispatch", dispatch);

watch(
	() => props.schema,
	(newSchema) => {
		const generatorData = isObject(props.data) ? props.data : {};
		schemaToUse.value = newSchema ?? Generate.jsonSchema(generatorData);
		if (!props.uischema) {
			uischemaToUse.value = Generate.uiSchema(schemaToUse.value, undefined, undefined, schemaToUse.value);
		}
	},
);

watch(
	() => props.uischema,
	(newUischema) => {
		uischemaToUse.value =
			newUischema ?? Generate.uiSchema(schemaToUse.value, undefined, undefined, schemaToUse.value);
	},
);

watch(
	() => props.data,
	(newData) => {
		dataToUse.value = newData;
	},
);

watch(
	() => props.renderers,
	(newRenderers) => {
		jsonforms.renderers = newRenderers;
	},
);

watch(
	() => props.cells,
	(newCells) => {
		jsonforms.cells = newCells;
	},
);

watch(
	() => props.uischemas,
	(newUischemas) => {
		jsonforms.uischemas = newUischemas;
	},
);

watch(
	() => props.config,
	(newConfig) => {
		jsonforms.config = configReducer(undefined, Actions.setConfig(newConfig));
	},
	{ deep: true },
);

watch(
	() => props.readonly,
	(newReadonly) => {
		jsonforms.readonly = newReadonly;
	},
);

watch([dataToUse, schemaToUse, uischemaToUse, () => props.validationMode], () => {
	jsonforms.core = props.middleware(
		jsonforms.core as JsonFormsCore,
		Actions.updateCore(dataToUse.value, schemaToUse.value, uischemaToUse.value, {
			validationMode: props.validationMode,
		}),
		coreReducer,
	);
});
</script>

<template>
	<DispatchRenderer
		v-if="jsonforms.core?.schema && jsonforms.core?.uischema"
		:schema="jsonforms.core.schema"
		:uischema="jsonforms.core.uischema"
		path=""
	/>
	<span v-else class="text-muted-foreground">{{ dataToUse ?? '' }}</span>
</template>

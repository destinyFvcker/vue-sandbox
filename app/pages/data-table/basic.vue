<template>
  <div class="m-10 rounded-lg border p-10">
    <UiDatatable :data="users" :options="options" @ready="tableRef = $event" />
  </div>
</template>

<script lang="ts" setup>
  import { faker } from "@faker-js/faker";
  import type { Config } from "datatables.net";
  import type DataTableRef from "datatables.net";

  const options: Config = {
    dom: "Q<'flex flex-col lg:flex-row w-full lg:items-start lg:justify-between gap-5 mb-5 lg:pr-1'Bf><'border rounded-lg't><'flex flex-col lg:flex-row gap-5 lg:items-center lg:justify-between pt-3 p-5'li><''p>",
    select: true,
    autoWidth: true,
    responsive: true,
    lengthMenu: [10, 20, 50, 100, 200, 500, 1000, 2000, 5000],

    buttons: [
      "copy",
      "csv",
      "excel",
      "pdf",
      "print",
      {
        text: "Select all",
        action: function (e, dt, _, __) {
          dt.rows().select();
        },
      },
    ],
    columns: [
      {
        data: "id.value",
        title: "ID",
        render(_, __, row, ___) {
          return row.id?.value ? row.id?.value : "N/A";
        },
      },
      { data: "name.first", title: "First Name" },
      { data: "name.last", title: "Last Name" },
      { data: "email", title: "Email" },
      { data: "phone", title: "Phone" },
      {
        data: "dob.date",
        title: "DOB",
        render(_, __, row, ___) {
          const formattedDob = useDateFormat(row.dob.date, "MMM DD, YYYY [at] h:mm A");
          return formattedDob.value;
        },
      },
      { data: "location.city", title: "City" },
      { data: "location.country", title: "Country" },
    ],
  };

  const users = ref(
    Array.from({ length: 100 }, () => ({
      id: { value: faker.string.alphanumeric(10).toUpperCase() },
      name: { first: faker.person.firstName(), last: faker.person.lastName() },
      email: faker.internet.email(),
      phone: faker.phone.number(),
      dob: { date: faker.date.birthdate({ min: 18, max: 70, mode: "age" }).toISOString() },
      location: { city: faker.location.city(), country: faker.location.country() },
    }))
  );

  const tableRef = shallowRef<InstanceType<typeof DataTableRef<any[]>> | undefined>();
</script>

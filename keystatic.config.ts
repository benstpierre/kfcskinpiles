import { config, fields, singleton } from "@keystatic/core";

export default config({
  storage: { kind: "local" },
  singletons: {
    home: singleton({
      label: "Skin Piles homepage",
      path: "src/content/home",
      schema: {
        eyebrow: fields.text({
          label: "Small introduction",
          validation: { isRequired: true },
        }),
        headline: fields.text({
          label: "Big headline",
          validation: { isRequired: true },
        }),
        intro: fields.text({
          label: "Introduction",
          multiline: true,
          validation: { isRequired: true },
        }),
        buckets: fields.array(
          fields.object({
            name: fields.text({
              label: "Bucket name",
              validation: { isRequired: true },
            }),
            tagline: fields.text({ label: "Small caption" }),
            description: fields.text({ label: "Description", multiline: true }),
          }),
          {
            label: "The buckets",
            itemLabel: (props) => props.fields.name.value,
          },
        ),
        questions: fields.array(
          fields.object({
            question: fields.text({
              label: "Question",
              validation: { isRequired: true },
            }),
            answer: fields.text({ label: "Answer", multiline: true }),
          }),
          {
            label: "Frequently asked skin questions",
            itemLabel: (props) => props.fields.question.value,
          },
        ),
      },
    }),
  },
});

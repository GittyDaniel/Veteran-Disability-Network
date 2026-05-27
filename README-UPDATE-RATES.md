# Guide: Updating VA Disability Pay Rates

This website's statistical tables are powered by a single configuration data file. This means you do **not** need to touch any code, HTML tables, or layouts to update the rates when new COLA increases are announced by the VA. 

Simply editing the numbers in the data file will automatically update the entire site, formatting the numbers into dollar amounts with commas and dollar signs.

---

## Step 1: Open the Data File
Navigate to the following folder and open the file:
📂 `src/data/vaRates.json`

You can edit this file in any text editor (like VS Code, Notepad, TextEdit) or directly in GitHub.

---

## Step 2: Update the Metadata (Header Description)
At the very top of the file, you will see a `"metadata"` block. Update the values inside the quotes to reflect the new year and COLA announcement:

```json
  "metadata": {
    "year": "2025",
    "colaIncrease": "2.5%",
    "effectiveDate": "December 1, 2024",
    "announcementDate": "October 10, 2024",
    "headerTitle": "2025 VA Disability Pay Rates to Increase by 2.5%",
    "headerDescription": "Effective December 1, 2024, the 2025 VA disability pay rates will reflect a 2.5% increase..."
  }
```

* **Note:** Make sure you keep the double quotes `" "` around text.

---

## Step 3: Update Flat Rates (10% & 20%)
Search for `"flatRates"` and update the values. Note that these are plain numbers (do not write dollar signs or quotes around the values):

```json
  "flatRates": {
    "10": 175.51,
    "20": 346.95
  }
```

---

## Step 4: Update the Main Table (Without Children)
Under `"withoutChildren"`, you will see a list of ratings from `100%` down to `30%`. For each percentage row, update the values:

```json
  {
    "rating": "100%",
    "alone": 3831.30,
    "spouse": 4044.91,
    "spouseOneParent": 4216.35,
    "spouseTwoParents": 4387.79,
    "oneParent": 4002.74,
    "twoParents": 4174.18
  }
```
* **Tip:** Only edit the numbers to the right of the colons (e.g. `3831.30`). Do **not** write dollar signs (`$`) or commas inside the numbers (write `3831.30`, **not** `$3,831.30`).

---

## Step 5: Update the Second Table (With Children)
Scroll down to `"withChildren"` and update the values for each rating:

```json
  {
    "rating": "100%",
    "child": 3974.15,
    "spouseChild": 4201.35,
    "spouseChildOneParent": 4372.79,
    "spouseChildTwoParents": 4544.23,
    "childOneParent": 4145.59,
    "childTwoParents": 4317.03
  }
```

---

## Step 6: Update Add-on Tables (Aid & Attendance & Additional Children)
At the bottom of the file, you will find the flat add-on numbers for each rating from `100` down to `30`:

* `"aidAndAttendance"`: Extra amount per rating if a spouse requires Aid & Attendance.
* `"additionalChildUnder18"`: Flat rate per additional child under age 18.
* `"additionalSchoolchildOver18"`: Flat rate per additional student over age 18.

Example:
```json
  "aidAndAttendance": {
    "100": 195.92,
    "90": 176.00,
    ...
  }
```

---

## Important Rules to Avoid Errors
1. **No currency formatting in numbers:** Write `1044.50`, **never** `$1,044.50`. The website handles the formatting automatically.
2. **Keep quotes correct:** Make sure all labels (like `"rating"`, `"alone"`) and metadata texts have double quotes `" "` around them. Numbers do not need quotes.
3. **No trailing commas on the last item:** In JSON, the last element in a list/object cannot end with a comma. (For example, in `"10": 175.51, "20": 346.95` the last item `346.95` has no comma after it).

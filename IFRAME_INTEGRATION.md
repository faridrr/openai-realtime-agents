# Iframe Integration Guide

This guide explains how to integrate the Cloe Edu Housing Assistant as an iframe with dynamic student parameters.

## Overview

The housing assistant now supports dynamic parameters passed through URL query strings, allowing you to personalize the experience for each student without modifying the code.

## Supported Parameters

| Parameter      | Description                         | Example       | Required              |
| -------------- | ----------------------------------- | ------------- | --------------------- |
| `student_name` | Student's first name                | `Marie`       | Yes                   |
| `school_name`  | Student's school name               | `Sciences Po` | Yes                   |
| `city`         | Target city for housing search      | `Paris`       | Yes                   |
| `language`     | Preferred language (en, fr, es, de) | `fr`          | No (defaults to 'en') |
| `agentConfig`  | Agent configuration                 | `realEstate`  | Yes                   |

## URL Format

```
https://your-domain.com/?agentConfig=realEstate&student_name=Marie&school_name=Sciences Po&city=Paris&language=fr
```

## Implementation Examples

### Basic Iframe Integration

```html
<iframe
  src="https://your-domain.com/?agentConfig=realEstate&student_name=Marie&school_name=Sciences Po&city=Paris&language=fr"
  width="100%"
  height="600px"
  title="Cloe Edu Housing Assistant"
>
</iframe>
```

### Dynamic Iframe with JavaScript

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Housing Assistant Integration</title>
  </head>
  <body>
    <div id="iframeContainer">
      <iframe id="housingAssistant" width="100%" height="600px"></iframe>
    </div>

    <script>
      function loadHousingAssistant(
        studentName,
        schoolName,
        city,
        language = "en"
      ) {
        const baseUrl = "https://your-domain.com/";
        const params = new URLSearchParams({
          agentConfig: "realEstate",
          student_name: studentName,
          school_name: schoolName,
          city: city,
          language: language,
        });

        const iframe = document.getElementById("housingAssistant");
        iframe.src = baseUrl + "?" + params.toString();
      }

      // Example usage
      loadHousingAssistant("Marie", "Sciences Po", "Paris", "fr");
    </script>
  </body>
</html>
```

### React Component Example

```jsx
import React, { useState, useEffect } from "react";

const HousingAssistant = ({
  studentName,
  schoolName,
  city,
  language = "en",
}) => {
  const [iframeSrc, setIframeSrc] = useState("");

  useEffect(() => {
    const baseUrl = "https://your-domain.com/";
    const params = new URLSearchParams({
      agentConfig: "realEstate",
      student_name: studentName,
      school_name: schoolName,
      city: city,
      language: language,
    });

    setIframeSrc(baseUrl + "?" + params.toString());
  }, [studentName, schoolName, city, language]);

  return (
    <iframe
      src={iframeSrc}
      width="100%"
      height="600px"
      title="Cloe Edu Housing Assistant"
      style={{ border: "none", borderRadius: "8px" }}
    />
  );
};

// Usage
<HousingAssistant
  studentName="Marie"
  schoolName="Sciences Po"
  city="Paris"
  language="fr"
/>;
```

## Parameter Details

### Student Name (`student_name`)

- **Type**: String
- **Required**: Yes
- **Description**: The student's first name that will be used in greetings
- **Example**: `Marie`, `John`, `Carlos`

### School Name (`school_name`)

- **Type**: String
- **Required**: Yes
- **Description**: The student's school or university name
- **Example**: `Sciences Po`, `HEC Paris`, `ESCP Business School`

### City (`city`)

- **Type**: String
- **Required**: Yes
- **Description**: The target city for housing search
- **Supported Cities**: Paris, Lyon, Marseille, Toulouse, Nice
- **Example**: `Paris`, `Lyon`, `Marseille`

### Language (`language`)

- **Type**: String
- **Required**: No (defaults to 'en')
- **Description**: The preferred language for the conversation
- **Supported Languages**:
  - `en` - English
  - `fr` - French
  - `es` - Spanish
  - `de` - German

## Fallback Behavior

If parameters are missing or invalid:

- **Missing student name**: Uses default "FARID"
- **Missing school name**: Uses default "ENSEEIHT"
- **Missing city**: Uses default "Paris"
- **Missing language**: Uses default "en"
- **Invalid city**: Agent will suggest alternatives during conversation

## Security Considerations

1. **URL Encoding**: Always properly encode parameter values, especially for names with special characters
2. **Validation**: Validate parameters on your side before passing them to the iframe
3. **HTTPS**: Use HTTPS for production deployments
4. **CORS**: Ensure proper CORS headers are configured if needed

## Example URLs

### French Student in Paris

```
https://your-domain.com/?agentConfig=realEstate&student_name=Marie&school_name=Sciences Po&city=Paris&language=fr
```

### English Student in Lyon

```
https://your-domain.com/?agentConfig=realEstate&student_name=John&school_name=HEC Paris&city=Lyon&language=en
```

### Spanish Student in Marseille

```
https://your-domain.com/?agentConfig=realEstate&student_name=Carlos&school_name=ESCP Business School&city=Marseille&language=es
```

## Testing

Use the provided `iframe-example.html` file to test different parameter combinations:

1. Open `iframe-example.html` in a web browser
2. Modify the parameters in the form
3. Click "Update Iframe" to see the changes
4. Use the quick example links for common scenarios

## Troubleshooting

### Common Issues

1. **Iframe not loading**: Check that the base URL is correct and accessible
2. **Parameters not working**: Ensure all required parameters are provided
3. **Language not changing**: Verify the language parameter is one of the supported values
4. **City not recognized**: Check that the city is in the supported list

### Debug Mode

To debug parameter parsing, check the browser console for any warnings about URL parameter extraction.

## Support

For technical support or questions about the iframe integration, please refer to the main project documentation or contact the development team.

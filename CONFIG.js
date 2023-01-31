const CONFIG = {
  "sheetURL": `https://docs.google.com/spreadsheets/d/1ICA2Z6eYCoBuqnPJBZUblUYXgiey31HRLY9lIb5awPU/`,
  "emailRecipient": `oleh.piddubnyi@groupone.com.pl`,
  "emailErrorsRecipient": `oleh.piddubnyi@groupone.com.pl`,
  "sheetName": `MCC_RAW`
}

const QUERY = {
  "campaign": `
          SELECT 
            customer.id,
            customer.descriptive_name,
            customer.currency_code,
            campaign.name,
            campaign.id,
            campaign.resource_name,
            campaign.labels,
            campaign.status,
            metrics.clicks,
            metrics.cost_micros,
            metrics.video_views,
            metrics.impressions
          FROM campaign 
          WHERE 
            segments.date DURING LAST_7_DAYS
            AND metrics.impressions > 0
        `,
  "label": `
          SELECT 
            label.resource_name, 
            label.name 
          FROM 
            label 
        `
}

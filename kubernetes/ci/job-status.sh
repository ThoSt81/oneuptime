#!/bin/bash 
curl -s -S  --header "PRIVATE-TOKEN: $PERSONAL_ACCESS_TOKEN" "https://gitlab.com/api/v4/projects/$CI_PROJECT_ID/pipelines/$CI_PIPELINE_ID/jobs?per_page=50" | jq -c ".[] | select(.name==\"$1\") | .name"
module CompaniesHelper

  def company_activity company, event
    case event[:type]
    when 'Stories created', 'Logos published'
      { customer: event[:story]['success']['customer']['name'],
        story_title: event[:story]['title'],
        story_path: event[:story]['csp_edit_story_path'] }
    when 'Stories published'
      { customer: event[:story]['success']['customer']['name'],
        story_title: event[:story]['title'],
        story_path: event[:story]['csp_story_path'] }
    when 'Contribution requests received', 'Contributions submitted'
      { customer: event[:contribution]['success']['customer']['name'],
        story_title: event[:contribution]['success']['story']['title'],
        story_path: event[:contribution]['success']['story']['csp_story_path'] }
    when 'Story views'
      { customer: event[:story_view]['success']['customer']['name'],
        story_title: event[:story_view]['success']['story']['title'],
        story_path: event[:story_view]['success']['story']['csp_story_path'] }
    # when 'Story shares'
    else
    end
  end
end

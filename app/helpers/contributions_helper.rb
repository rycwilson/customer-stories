# frozen_string_literal: true

module ContributionsHelper
  def status_html(contribution)
    date_format = '%-m/%-d/%y'
    invitation_sent_at = contribution.request_sent_at
    case contribution.status
    when 'pre_request'
      <<~HTML
        <div>
          <p>waiting for invitation</p>
          <p>(added #{contribution.created_at.strftime(date_format)})</p>
        </div>
      HTML
    when 'request_sent'
      "<p>invitation sent #{invitation_sent_at.strftime(date_format)}</p>"
    when 'first_reminder_sent'
      sent_at = invitation_sent_at + contribution.first_reminder_wait.days
      "<p>reminder sent #{sent_at.strftime(date_format)}</p>"
    when 'second_reminder_sent'
      sent_at = invitation_sent_at +
                contribution.first_reminder_wait.days +
                contribution.second_reminder_wait.days
      "<p>reminder sent #{sent_at.strftime(date_format)}</p>"
    when 'request_re_sent'
      "<p>invitation re-sent #{invitation_sent_at.strftime(date_format)}</p>"
    else
      "<p>#{contribution.status.tr('_', ' ')}</p>"
    end
  end

  def contributions_table_filters curator_id
    { 
      'curator-id': curator_id,
      'show-completed': cookies['csp-show-completed'] ? cookies['csp-show-completed'] == 'true' : true, 
      'show-published': cookies['csp-show-published'] ? cookies['csp-show-published'] == 'true' : true
    }
  end

  def contributions_display_options_escaped_html company, curator_id
    html = render(
      'contributions/display_options',
      { 
        company:, 
        curator_id:,
        enable_row_groups: cookies['csp-contributions-row-groups'].present? ? 
          cookies['csp-contributions-row-groups'] == 'true' :
          true, 
      }
    )
    escape_once(html)
  end
end

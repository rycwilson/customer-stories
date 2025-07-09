# frozen_string_literal: true

module ContributionsHelper
  def self.status_html(contribution)
    date_format = '%-m/%-d/%y'
    invitation_sent_at = contribution.request_sent_at
    case contribution.status
    when 'pre_request'
      <<~HTML.squish
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

  def contributions_table_filters(curator_id)
    {
      'curator-id': curator_id,
      'show-completed': if cookies['csp-show-completed'].present?
                          cookies['csp-show-completed'] == 'true'
                        else
                          true
                        end,
      'show-published': if cookies['csp-show-published'].present?
                          cookies['csp-show-published'] == 'true'
                        else
                          true
                        end
    }
  end

  def contributions_display_options_escaped_html(company, curator_id)
    html = render(
      'contributions/display_options',
      {
        company: company,
        curator_id: curator_id,
        enable_row_groups: if cookies['csp-contributions-row-groups'].present?
                             cookies['csp-contributions-row-groups'] == 'true'
                           else
                             true
                           end
      }
    )
    escape_once(html)
  end
end

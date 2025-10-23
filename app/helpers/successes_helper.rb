# frozen_string_literal: true

module SuccessesHelper
  # NOTE: This is a class method so it may be scoped when called and not conflict with the
  # ContributionsHelper.status_html method.
  def self.status_html(win)
    contributions = win.contributions.select(:id, :status)
    if contributions.empty?
      <<~HTML.squish.gsub('<p></p>', '')
        <p>0&nbsp;&nbsp;Contributors added</p>
        <p>#{'Win Story completed' if win.win_story_completed?}</p>
      HTML
    elsif contributions.invitation_sent.empty?
      <<~HTML.squish.gsub('<p></p>', '')
        <p>0&nbsp;&nbsp;Contributors invited</p>
        <p>#{'Win Story completed' if win.win_story_completed?}</p>
      HTML
    elsif win.win_story_completed?
      <<~HTML.squish
        <p>#{contributions.submitted.length}&nbsp;&nbsp;Contributions submitted</p>
        <p>Win Story completed</p>
      HTML
    else
      <<~HTML.squish
        <p>#{contributions.invitation_sent.length}&nbsp;&nbsp;Contributors invited</p>
        <p>#{contributions.submitted.length}&nbsp;&nbsp;Contributions submitted</p>
      HTML
    end
  end

  def customer_wins_filters(curator_id)
    {
      'curator': curator_id,
      'show-wins-with-story': if cookies['csp-show-wins-with-story']
                                cookies['csp-show-wins-with-story'] == 'true'
                              else
                                true
                              end
    }
  end

  def customer_wins_display_options_escaped_html(company, curator_id = nil)
    html = render(
      'successes/display_options',
      {
        company:,
        curator_id:,
        enable_row_groups: if cookies['csp-customer-wins-row-groups'].present?
                             cookies['csp-customer-wins-row-groups'] == 'true'
                           else
                             true
                           end
      }
    )
    escape_once(html)
  end
end

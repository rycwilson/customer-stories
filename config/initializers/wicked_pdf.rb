# WickedPDF Global Configuration
#
# Use this to set up shared configuration options for your entire application.
# Any of the configuration options shown here can also be applied to single
# models by passing arguments to the `render :pdf` call.
#
# To learn more, check out the README:
#
# https://github.com/mileszs/wicked_pdf/blob/master/README.md

WickedPdf.config = {
  # Path to the wkhtmltopdf executable: This usually isn't needed if using
  # one of the wkhtmltopdf-binary family of gems.
  # exe_path: '/Users/wilson/.rbenv/shims/wkhtmltopdf',
  #   or
  # exe_path: Gem.bin_path('wkhtmltopdf-binary', 'wkhtmltopdf'),

  # Layout file to be used for all PDFs
  # (but can be overridden in `render :pdf` calls)
  layout: 'pdf.html.erb'
}

# To get around OSX Yosemite bug,
# replace your config/initializers/wicked_pdf.rb with this ...
# (ref: http://dchua.com/2014/10/30/generate-pdfs-with-html-templates-in-rails/)
# module WickedPdfHelper
#   if Rails.env.development?
#     if RbConfig::CONFIG['host_os'] =~ /linux/
#       executable = RbConfig::CONFIG['host_cpu'] == 'x86_64' ?
#                     'wkhtmltopdf_linux_x64' : 'wkhtmltopdf_linux_386'
#     elsif RbConfig::CONFIG['host_os'] =~ /darwin/
#       executable = 'wkhtmltopdf_darwin_386'
#     else
#       raise 'Invalid platform. Must be running linux or intel-based Mac OS.'
#     end
#     WickedPdf.config = {
#       exe_path: "#{Gem.bin_path('wkhtmltopdf-binary').match(/(.+)\/.+/).captures.first}/#{executable}"
#     }
#   end
# end




require 'xcodeproj'
require 'pathname'
root = File.expand_path('..', __dir__)
project_path = File.join(root, 'DERTOURDemo.xcodeproj')
project = Xcodeproj::Project.new(project_path)
app = project.new_target(:application, 'DERTOURDemo', :ios, '17.0')
app.product_name = 'DERTOURDemo'
group = project.main_group.new_group('DERTOURDemo', 'DERTOURDemo')
Dir[File.join(root, 'DERTOURDemo', '*.swift')].sort.each { |path| app.source_build_phase.add_file_reference(group.new_file(File.basename(path))) }
resources = group.new_group('Resources', 'Resources')
Dir[File.join(root, 'DERTOURDemo/Resources/*')].sort.each { |path| app.resources_build_phase.add_file_reference(resources.new_file(File.basename(path))) }
sdk_root = File.join(root, '.build/MeiroSDK')
abort 'Run scripts/prepare-sdk.sh before generating the project.' unless Dir.exist?(sdk_root)
sdk = project.new_target(:framework, 'Meiro', :ios, '17.0')
sg = project.main_group.new_group('Meiro SDK (private dependency)', '.build/MeiroSDK')
Dir[File.join(sdk_root, 'Meiro/Sources/**/*.swift')].sort.each { |path| sdk.source_build_phase.add_file_reference(sg.new_file(Pathname.new(path).relative_path_from(Pathname.new(sdk_root)).to_s)) }
Dir[File.join(sdk_root, 'Meiro/Resources/**/*')].select { |p| File.file?(p) }.sort.each { |path| sdk.resources_build_phase.add_file_reference(sg.new_file(Pathname.new(path).relative_path_from(Pathname.new(sdk_root)).to_s)) }
sdk.build_configurations.each { |c| c.build_settings.merge!({'PRODUCT_BUNDLE_IDENTIFIER'=>'io.meiro.sdk','GENERATE_INFOPLIST_FILE'=>'YES','SWIFT_VERSION'=>'5.0','DEFINES_MODULE'=>'YES','SKIP_INSTALL'=>'YES','MARKETING_VERSION'=>'1.1.1','CURRENT_PROJECT_VERSION'=>'1','CODE_SIGNING_ALLOWED'=>'NO'}) }
app.add_dependency(sdk)
app.frameworks_build_phase.add_file_reference(sdk.product_reference)
embed = app.new_copy_files_build_phase('Embed Frameworks'); embed.dst_subfolder_spec = '10'
embedded = embed.add_file_reference(sdk.product_reference); embedded.settings = {'ATTRIBUTES'=>['CodeSignOnCopy','RemoveHeadersOnCopy']}
app.build_configurations.each do |config|
 config.build_settings.merge!({'PRODUCT_BUNDLE_IDENTIFIER'=>'de.dertour.demo','PRODUCT_NAME'=>'DERTOURDemo','SWIFT_VERSION'=>'5.0','IPHONEOS_DEPLOYMENT_TARGET'=>'17.0','TARGETED_DEVICE_FAMILY'=>'1','GENERATE_INFOPLIST_FILE'=>'NO','INFOPLIST_FILE'=>'Info.plist','CODE_SIGN_STYLE'=>'Automatic','SWIFT_ACTIVE_COMPILATION_CONDITIONS'=> '$(inherited) MEIRO_IN_APP','ASSETCATALOG_COMPILER_APPICON_NAME'=>'AppIcon','LD_RUNPATH_SEARCH_PATHS'=>'$(inherited) @executable_path/Frameworks'})
end
scheme = Xcodeproj::XCScheme.new
scheme.add_build_target(app); scheme.set_launch_target(app)
if Dir.exist?(File.join(root,'DERTOURDemoUITests'))
 tests = project.new_target(:ui_test_bundle, 'DERTOURDemoUITests', :ios, '17.0')
 tests.add_dependency(app)
 tg = project.main_group.new_group('DERTOURDemoUITests', 'DERTOURDemoUITests')
 Dir[File.join(root,'DERTOURDemoUITests/*.swift')].each { |path| tests.source_build_phase.add_file_reference(tg.new_file(File.basename(path))) }
 tests.build_configurations.each { |c| c.build_settings.merge!({'PRODUCT_BUNDLE_IDENTIFIER'=>'de.dertour.demo.uitests','GENERATE_INFOPLIST_FILE'=>'YES','SWIFT_VERSION'=>'5.0','TEST_TARGET_NAME'=>'DERTOURDemo','CODE_SIGN_STYLE'=>'Automatic'}) }
 scheme.add_test_target(tests)
end
project.save
scheme.save_as(project_path, 'DERTOURDemo', true)
puts project_path

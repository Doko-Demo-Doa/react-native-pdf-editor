#include <jni.h>
#include "pdfeditorOnLoad.hpp"

#include <fbjni/fbjni.h>


JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
  return facebook::jni::initialize(vm, []() {
    margelo::nitro::pdfeditor::registerAllNatives();
  });
}